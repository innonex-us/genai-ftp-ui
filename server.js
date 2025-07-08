const express = require('express');
const multer = require('multer');
const { Client } = require('basic-ftp');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', req.body);
  }
  next();
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Store active FTP connections
const ftpConnections = new Map();

// Helper function to get or create FTP connection
async function getFtpConnection(connectionId, config) {
  if (ftpConnections.has(connectionId)) {
    return ftpConnections.get(connectionId);
  }

  const client = new Client();
  
  try {
    console.log(`Attempting FTP connection to ${config.host}:${config.port} with user ${config.username}`);
    
    await client.access({
      host: config.host,
      port: config.port || 21,
      user: config.username,
      password: config.password,
      secure: config.secure || false,
      secureOptions: config.secure ? { rejectUnauthorized: false } : undefined
    });
    
    console.log(`FTP connection successful for ${connectionId}`);
    ftpConnections.set(connectionId, client);
    return client;
  } catch (error) {
    console.error(`FTP connection failed for ${connectionId}:`, error.message);
    throw new Error(`FTP connection failed: ${error.message}`);
  }
}

// API Routes

// Test FTP connection
app.post('/api/connect', async (req, res) => {
  try {
    const { host, port, username, password, secure } = req.body;
    console.log(`Connection request received for ${host}:${port}`);
    
    if (!host || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Host, username, and password are required'
      });
    }
    
    const connectionId = `${host}_${username}_${Date.now()}`;
    
    const client = await getFtpConnection(connectionId, {
      host,
      port: parseInt(port) || 21,
      username,
      password,
      secure: secure === 'true' || secure === true
    });

    console.log(`Connection successful for ${connectionId}`);
    res.json({
      success: true,
      connectionId,
      message: 'Connected successfully'
    });
  } catch (error) {
    console.error('Connection error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// List directory contents
app.post('/api/list', async (req, res) => {
  try {
    const { connectionId, path: dirPath = '/' } = req.body;
    
    if (!ftpConnections.has(connectionId)) {
      return res.status(400).json({
        success: false,
        message: 'No active connection found'
      });
    }

    const client = ftpConnections.get(connectionId);
    const list = await client.list(dirPath);
    
    const formattedList = list.map(item => ({
      name: item.name,
      type: item.type === 1 ? 'file' : 'directory',
      size: item.size,
      date: item.date,
      permissions: item.permissions
    }));

    res.json({
      success: true,
      path: dirPath,
      contents: formattedList
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Download file
app.post('/api/download', async (req, res) => {
  try {
    const { connectionId, filePath } = req.body;
    
    if (!ftpConnections.has(connectionId)) {
      return res.status(400).json({
        success: false,
        message: 'No active connection found'
      });
    }

    const client = ftpConnections.get(connectionId);
    const filename = path.basename(filePath);
    const localPath = `./downloads/${filename}`;
    
    // Ensure downloads directory exists
    await fs.ensureDir('./downloads');
    
    await client.downloadTo(localPath, filePath);
    
    res.download(localPath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up the temporary file
      fs.remove(localPath).catch(console.error);
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Upload file
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { connectionId, targetPath } = req.body;
    
    if (!ftpConnections.has(connectionId)) {
      return res.status(400).json({
        success: false,
        message: 'No active connection found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const client = ftpConnections.get(connectionId);
    const remotePath = path.join(targetPath || '/', req.file.originalname);
    
    await client.uploadFrom(req.file.path, remotePath);
    
    // Clean up uploaded file
    await fs.remove(req.file.path);
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      filename: req.file.originalname
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Create directory
app.post('/api/mkdir', async (req, res) => {
  try {
    const { connectionId, dirPath } = req.body;
    
    if (!ftpConnections.has(connectionId)) {
      return res.status(400).json({
        success: false,
        message: 'No active connection found'
      });
    }

    const client = ftpConnections.get(connectionId);
    await client.ensureDir(dirPath);
    
    res.json({
      success: true,
      message: 'Directory created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete file or directory
app.post('/api/delete', async (req, res) => {
  try {
    const { connectionId, itemPath, type } = req.body;
    
    if (!ftpConnections.has(connectionId)) {
      return res.status(400).json({
        success: false,
        message: 'No active connection found'
      });
    }

    const client = ftpConnections.get(connectionId);
    
    if (type === 'directory') {
      await client.removeDir(itemPath);
    } else {
      await client.remove(itemPath);
    }
    
    res.json({
      success: true,
      message: `${type} deleted successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Rename file or directory
app.post('/api/rename', async (req, res) => {
  try {
    const { connectionId, oldPath, newPath } = req.body;
    
    if (!ftpConnections.has(connectionId)) {
      return res.status(400).json({
        success: false,
        message: 'No active connection found'
      });
    }

    const client = ftpConnections.get(connectionId);
    await client.rename(oldPath, newPath);
    
    res.json({
      success: true,
      message: 'Item renamed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Disconnect
app.post('/api/disconnect', async (req, res) => {
  try {
    const { connectionId } = req.body;
    
    if (ftpConnections.has(connectionId)) {
      const client = ftpConnections.get(connectionId);
      client.close();
      ftpConnections.delete(connectionId);
    }
    
    res.json({
      success: true,
      message: 'Disconnected successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`FTP Web UI server running on http://localhost:${PORT}`);
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('Closing FTP connections...');
  ftpConnections.forEach(client => client.close());
  process.exit();
});
