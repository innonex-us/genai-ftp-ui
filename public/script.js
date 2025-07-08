// Global variables
let currentConnectionId = null;
let currentPath = '/';
let currentRenameTarget = null;

// DOM elements
const connectionPanel = document.getElementById('connectionPanel');
const mainInterface = document.getElementById('mainInterface');
const connectionStatus = document.getElementById('connectionStatus');
const connectionForm = document.getElementById('connectionForm');
const fileTableBody = document.getElementById('fileTableBody');
const breadcrumb = document.getElementById('breadcrumb');
const loading = document.getElementById('loading');
const notificationArea = document.getElementById('notificationArea');

// Modal elements
const uploadModal = document.getElementById('uploadModal');
const newFolderModal = document.getElementById('newFolderModal');
const renameModal = document.getElementById('renameModal');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

// Event Listeners
function initializeEventListeners() {
    // Connection form
    connectionForm.addEventListener('submit', handleConnect);
    
    // Toolbar buttons
    document.getElementById('disconnectBtn').addEventListener('click', handleDisconnect);
    document.getElementById('refreshBtn').addEventListener('click', () => loadDirectory(currentPath));
    document.getElementById('uploadBtn').addEventListener('click', () => showModal('uploadModal'));
    document.getElementById('newFolderBtn').addEventListener('click', () => showModal('newFolderModal'));
    
    // Modal controls
    document.getElementById('closeUploadModal').addEventListener('click', () => hideModal('uploadModal'));
    document.getElementById('closeNewFolderModal').addEventListener('click', () => hideModal('newFolderModal'));
    document.getElementById('closeRenameModal').addEventListener('click', () => hideModal('renameModal'));
    
    // Upload functionality
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    
    // Forms
    document.getElementById('newFolderForm').addEventListener('submit', handleCreateFolder);
    document.getElementById('renameForm').addEventListener('submit', handleRename);
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Connection handling
async function handleConnect(event) {
    event.preventDefault();
    
    const formData = new FormData(connectionForm);
    const connectionData = {
        host: formData.get('host'),
        port: formData.get('port'),
        username: formData.get('username'),
        password: formData.get('password'),
        secure: formData.get('secure') === 'on'
    };
    
    showLoading();
    
    try {
        const response = await fetch('/api/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(connectionData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentConnectionId = result.connectionId;
            showConnectedState();
            await loadDirectory('/');
            showNotification('Connected successfully!', 'success');
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Connection failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function handleDisconnect() {
    if (!currentConnectionId) return;
    
    try {
        await fetch('/api/disconnect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ connectionId: currentConnectionId })
        });
        
        showDisconnectedState();
        showNotification('Disconnected successfully!', 'info');
    } catch (error) {
        showNotification('Disconnect failed: ' + error.message, 'error');
    }
}

// Directory operations
async function loadDirectory(path) {
    if (!currentConnectionId) return;
    
    showLoading();
    
    try {
        const response = await fetch('/api/list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                connectionId: currentConnectionId,
                path: path
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentPath = result.path;
            updateBreadcrumb(currentPath);
            renderFileList(result.contents);
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to load directory: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderFileList(files) {
    fileTableBody.innerHTML = '';
    
    // Add parent directory link if not at root
    if (currentPath !== '/') {
        const parentRow = createFileRow({
            name: '..',
            type: 'directory',
            size: '',
            date: '',
            isParent: true
        });
        fileTableBody.appendChild(parentRow);
    }
    
    // Sort files: directories first, then files
    files.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });
    
    files.forEach(file => {
        const row = createFileRow(file);
        fileTableBody.appendChild(row);
    });
}

function createFileRow(file) {
    const row = document.createElement('tr');
    
    const nameCell = document.createElement('td');
    const nameDiv = document.createElement('div');
    nameDiv.className = 'file-item';
    nameDiv.innerHTML = `
        <i class="fas ${file.type === 'directory' ? 'fa-folder' : 'fa-file'} file-icon ${file.type}"></i>
        <span>${file.name}</span>
    `;
    
    if (!file.isParent) {
        nameDiv.addEventListener('dblclick', () => {
            if (file.type === 'directory') {
                const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
                loadDirectory(newPath);
            }
        });
    } else {
        nameDiv.addEventListener('dblclick', () => {
            const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
            loadDirectory(parentPath);
        });
    }
    
    nameCell.appendChild(nameDiv);
    
    const typeCell = document.createElement('td');
    typeCell.textContent = file.type === 'directory' ? 'Folder' : 'File';
    
    const sizeCell = document.createElement('td');
    sizeCell.textContent = file.type === 'file' ? formatFileSize(file.size) : '';
    
    const dateCell = document.createElement('td');
    dateCell.textContent = file.date ? new Date(file.date).toLocaleString() : '';
    
    const actionsCell = document.createElement('td');
    if (!file.isParent) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'file-actions';
        
        if (file.type === 'file') {
            actionsDiv.innerHTML = `
                <button class="btn btn-info" onclick="downloadFile('${file.name}')">
                    <i class="fas fa-download"></i> Download
                </button>
            `;
        }
        
        actionsDiv.innerHTML += `
            <button class="btn btn-warning" onclick="renameItem('${file.name}', '${file.type}')">
                <i class="fas fa-edit"></i> Rename
            </button>
            <button class="btn btn-danger" onclick="deleteItem('${file.name}', '${file.type}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        `;
        
        actionsCell.appendChild(actionsDiv);
    }
    
    row.appendChild(nameCell);
    row.appendChild(typeCell);
    row.appendChild(sizeCell);
    row.appendChild(dateCell);
    row.appendChild(actionsCell);
    
    return row;
}

// File operations
async function downloadFile(filename) {
    if (!currentConnectionId) return;
    
    const filePath = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;
    
    showLoading();
    
    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                connectionId: currentConnectionId,
                filePath: filePath
            })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showNotification('File downloaded successfully!', 'success');
        } else {
            const result = await response.json();
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Download failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function uploadFiles(files) {
    if (!currentConnectionId || !files.length) return;
    
    const formData = new FormData();
    formData.append('file', files[0]); // For simplicity, upload one file at a time
    formData.append('connectionId', currentConnectionId);
    formData.append('targetPath', currentPath);
    
    showUploadProgress();
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('File uploaded successfully!', 'success');
            await loadDirectory(currentPath);
            hideModal('uploadModal');
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Upload failed: ' + error.message, 'error');
    } finally {
        hideUploadProgress();
    }
}

async function handleCreateFolder(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const folderName = formData.get('folderName');
    const folderPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;
    
    showLoading();
    
    try {
        const response = await fetch('/api/mkdir', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                connectionId: currentConnectionId,
                dirPath: folderPath
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Folder created successfully!', 'success');
            await loadDirectory(currentPath);
            hideModal('newFolderModal');
            event.target.reset();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to create folder: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renameItem(name, type) {
    currentRenameTarget = { name, type };
    document.getElementById('newName').value = name;
    showModal('renameModal');
}

async function handleRename(event) {
    event.preventDefault();
    
    if (!currentRenameTarget) return;
    
    const formData = new FormData(event.target);
    const newName = formData.get('newName');
    
    const oldPath = currentPath === '/' ? `/${currentRenameTarget.name}` : `${currentPath}/${currentRenameTarget.name}`;
    const newPath = currentPath === '/' ? `/${newName}` : `${currentPath}/${newName}`;
    
    showLoading();
    
    try {
        const response = await fetch('/api/rename', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                connectionId: currentConnectionId,
                oldPath: oldPath,
                newPath: newPath
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Item renamed successfully!', 'success');
            await loadDirectory(currentPath);
            hideModal('renameModal');
            currentRenameTarget = null;
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Rename failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function deleteItem(name, type) {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    const itemPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
    
    showLoading();
    
    try {
        const response = await fetch('/api/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                connectionId: currentConnectionId,
                itemPath: itemPath,
                type: type
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`${type} deleted successfully!`, 'success');
            await loadDirectory(currentPath);
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Delete failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Upload handling
function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
        uploadFiles(files);
    }
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
        uploadFiles(files);
    }
}

// UI Helper functions
function showConnectedState() {
    connectionPanel.style.display = 'none';
    mainInterface.style.display = 'block';
    
    const statusDot = connectionStatus.querySelector('.status-dot');
    const statusText = connectionStatus.querySelector('.status-text');
    
    statusDot.className = 'status-dot connected';
    statusText.textContent = 'Connected';
}

function showDisconnectedState() {
    connectionPanel.style.display = 'block';
    mainInterface.style.display = 'none';
    
    const statusDot = connectionStatus.querySelector('.status-dot');
    const statusText = connectionStatus.querySelector('.status-text');
    
    statusDot.className = 'status-dot disconnected';
    statusText.textContent = 'Not Connected';
    
    currentConnectionId = null;
    currentPath = '/';
}

function updateBreadcrumb(path) {
    breadcrumb.innerHTML = '';
    
    const pathParts = path.split('/').filter(part => part !== '');
    
    // Root
    const rootItem = document.createElement('span');
    rootItem.className = path === '/' ? 'breadcrumb-item active' : 'breadcrumb-item';
    rootItem.textContent = '/';
    rootItem.addEventListener('click', () => {
        if (path !== '/') loadDirectory('/');
    });
    breadcrumb.appendChild(rootItem);
    
    // Path parts
    let currentPathBuild = '';
    pathParts.forEach((part, index) => {
        const separator = document.createElement('span');
        separator.textContent = ' / ';
        breadcrumb.appendChild(separator);
        
        currentPathBuild += '/' + part;
        const item = document.createElement('span');
        item.className = index === pathParts.length - 1 ? 'breadcrumb-item active' : 'breadcrumb-item';
        item.textContent = part;
        
        if (index < pathParts.length - 1) {
            const targetPath = currentPathBuild;
            item.addEventListener('click', () => loadDirectory(targetPath));
        }
        
        breadcrumb.appendChild(item);
    });
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showLoading() {
    loading.style.display = 'flex';
}

function hideLoading() {
    loading.style.display = 'none';
}

function showUploadProgress() {
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    uploadProgress.style.display = 'block';
    
    // Simulate progress for demo purposes
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        progressFill.style.width = progress + '%';
        progressText.textContent = progress + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 100);
}

function hideUploadProgress() {
    const uploadProgress = document.getElementById('uploadProgress');
    uploadProgress.style.display = 'none';
    
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notificationArea.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notificationArea.removeChild(notification);
        }
    }, 5000);
    
    // Allow manual removal
    notification.addEventListener('click', () => {
        if (notification.parentNode) {
            notificationArea.removeChild(notification);
        }
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
