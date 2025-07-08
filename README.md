# FTP Web UI

A modern, responsive web-based FTP client that allows you to manage files on your FTP server through a beautiful web interface.

## Features

- **Connect to FTP Servers**: Support for both standard FTP and secure FTPS connections
- **File Management**: Upload, download, rename, and delete files and folders
- **Directory Navigation**: Browse directories with an intuitive breadcrumb navigation
- **Drag & Drop Upload**: Simply drag files from your computer to upload them
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Notifications**: Get instant feedback on all operations
- **Modern UI**: Clean, professional interface with smooth animations

## Screenshots

The interface includes:
- Connection panel for FTP server credentials
- File explorer with sortable columns
- Toolbar with quick actions (upload, create folder, refresh)
- Modal dialogs for upload progress and folder creation
- Notification system for user feedback

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and go to `http://localhost:3000`

## Usage

### Connecting to Your FTP Server

1. Enter your FTP server details:
   - **Host**: Your server IP address or hostname (e.g., `localhost`, `192.168.1.100`)
   - **Port**: FTP port (usually 21)
   - **Username**: Your FTP username
   - **Password**: Your FTP password
   - **Secure**: Check if you're using FTPS

2. Click "Connect" to establish the connection

### Managing Files

Once connected, you can:

- **Navigate**: Double-click folders to enter them, use breadcrumb navigation to go back
- **Upload Files**: Click "Upload" button or drag files directly to the upload area
- **Create Folders**: Click "New Folder" and enter the folder name
- **Download Files**: Click the download button next to any file
- **Rename**: Click the rename button to change file/folder names
- **Delete**: Click the delete button to remove files or folders

### Keyboard Shortcuts

- **F5**: Refresh current directory
- **Escape**: Close open modals

## Configuration

### Environment Variables

You can customize the server configuration using environment variables:

- `PORT`: Server port (default: 3000)

### FTP Server Compatibility

This FTP client is compatible with most standard FTP servers including:
- vsftpd
- ProFTPD
- Pure-FTPd
- FileZilla Server
- IIS FTP
- And many others

## Development

To run in development mode with auto-restart:

```bash
npm run dev
```

## Dependencies

### Backend
- **Express**: Web server framework
- **basic-ftp**: FTP client library
- **multer**: File upload handling
- **cors**: Cross-origin resource sharing
- **fs-extra**: Enhanced file system operations

### Frontend
- **Vanilla JavaScript**: No frameworks, pure JavaScript
- **Font Awesome**: Icons
- **CSS3**: Modern styling with animations

## Security Considerations

- **HTTPS**: For production, use HTTPS to encrypt credentials
- **Input Validation**: All user inputs are validated on the server
- **File Restrictions**: Consider implementing file type and size restrictions
- **Authentication**: Add user authentication for multi-user environments

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Troubleshooting

### Connection Issues

1. **"Connection refused"**: Check if FTP server is running and accessible
2. **"Authentication failed"**: Verify username and password
3. **"Permission denied"**: Check user permissions on the FTP server
4. **"Timeout"**: Check firewall settings and network connectivity

### Upload/Download Issues

1. **"Upload failed"**: Check available disk space and permissions
2. **"Download failed"**: Verify file exists and is readable
3. **Large files**: For large files, consider increasing timeout settings

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support, please:
1. Check the troubleshooting section
2. Verify your FTP server configuration
3. Check browser console for error messages
4. Create an issue with detailed information about your setup

---

**Note**: This is a web-based FTP client. Make sure your FTP server is properly configured and accessible from the machine running this application.
