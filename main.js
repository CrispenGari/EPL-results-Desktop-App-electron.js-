const electron = require("electron");
const path = require("path");
const url = require("url");
const ipc = electron.ipcMain;

let window;

const createWindow = () => {
  window = new electron.BrowserWindow({
    width: 800,
    height: 505,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });

  window.loadURL(
    url.format({
      pathname: path.join(__dirname, "src/index.html"),
      protocol: "file",
      slashes: true,
    })
  );
  // window.webContents.openDevTools({ mode: "bottom" });
  window.on("closed", () => {
    window: null;
  });
};
electron.app.on("ready", createWindow);
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipc.on("closing-app", (event, args) => {
  electron.dialog
    .showMessageBox(window, {
      message: "Are you sure you want to close the Premier League App?",
      title: "Clossing The Premier League App",
      buttons: ["Yes", "No", "Cancel"],
      defaultId: 0,
      cancelId: 2,
      closeId: 1,
    })
    .then((response) => {
      if (response.response === 0) {
        electron.app.quit();
      } else {
        electron.app.focus();
      }
    });
});
