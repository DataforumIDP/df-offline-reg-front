const config = {
    "appId": "com.rega.desktop",
    "productName": "Нова Рега",
    "directories": {
        "output": "release",
        "buildResources": "build"
    },
    "files": [
        "dist/**/*",
        "dist-electron/**/*",
        "public/**/*"
    ],
    "extraResources": [
        {
            "from": "public/fonts",
            "to": "fonts"
        },
        {
            "from": "installer-files",
            "to": "installer-files"
        },
        {
            "from": "build/icon.ico",
            "to": "icon.ico"
        }
    ],
    "win": {
        "target": [
            {
                "target": "nsis",
                "arch": [
                    "x64"
                ]
            }
        ],
        "icon": "build/icon.ico"
    },
    "nsis": {
        "oneClick": false, // чтобы пользователь мог выбрать путь установки
        "perMachine": true, // установка для текущего пользователя (localappdata)
        "allowToChangeInstallationDirectory": false,
    },
    publish: [
        {
            provider: 'generic',
            url: 'https://e8c490b0-8f86-49e6-b849-57f0230dd8a5.selstorage.ru/windows/'
        }
    ],
};
module.exports = config;
