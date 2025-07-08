# FTP Server Connection Examples

## Local Ubuntu Server (vsftpd)
If you set up vsftpd on your Ubuntu server, use these settings:

### Connection Details:
- **Host**: `localhost` (if running on same machine) or `your-server-ip`
- **Port**: `21` (default FTP port)
- **Username**: Your Ubuntu username or FTP user you created
- **Password**: Your Ubuntu password or FTP user password
- **Secure**: Unchecked (unless you configured FTPS)

### Common vsftpd Configuration:
```bash
# /etc/vsftpd.conf settings that might be useful:
listen=YES
local_enable=YES
write_enable=YES
local_umask=022
dirmessage_enable=YES
use_localtime=YES
xferlog_enable=YES
connect_from_port_20=YES
chroot_local_user=YES
allow_writeable_chroot=YES
secure_chroot_dir=/var/run/vsftpd/empty
pam_service_name=vsftpd
rsa_cert_file=/etc/ssl/certs/ssl-cert-snakeoil.pem
rsa_private_key_file=/etc/ssl/private/ssl-cert-snakeoil.key
ssl_enable=NO
```

## Other FTP Servers

### ProFTPD:
- **Port**: 21
- **Features**: Supports virtual users, SSL/TLS

### Pure-FTPd:
- **Port**: 21
- **Features**: Lightweight, secure by default

### FileZilla Server (Windows):
- **Port**: 21
- **GUI**: Comes with management interface

## Security Tips

1. **Use FTPS when possible** - Enable SSL/TLS encryption
2. **Create dedicated FTP users** - Don't use root or admin accounts
3. **Restrict access** - Use chroot to limit directory access
4. **Strong passwords** - Use complex passwords for FTP accounts
5. **Firewall rules** - Only allow FTP access from trusted networks

## Testing Your FTP Server

Before using the web UI, test your FTP server with command line:

```bash
# Test connection
ftp your-server-ip

# Or with secure FTP
sftp username@your-server-ip
```

## Troubleshooting

### Common Issues:

1. **Connection Refused**:
   - Check if FTP service is running: `sudo systemctl status vsftpd`
   - Start service: `sudo systemctl start vsftpd`

2. **Permission Denied**:
   - Check user permissions
   - Verify chroot settings
   - Check file ownership: `sudo chown -R ftpuser:ftpuser /home/ftpuser`

3. **Passive Mode Issues**:
   - Configure passive port range in FTP server
   - Open firewall ports for passive mode

4. **Upload/Download Fails**:
   - Check disk space: `df -h`
   - Verify write permissions
   - Check file size limits
