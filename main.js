const { app, BrowserWindow } = require('electron')
const path = require('node:path')

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 768,
        webPreferences: {
            backgroundThrottling: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('index.html')
    // win.setFullScreen(true);
    // win.setMinimizable(false);
    win.setMenuBarVisibility(false);
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})


