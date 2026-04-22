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
    "linux": {
        "target": [
            {
                "target": "AppImage",
                "arch": [
                    "x64"
                ]
            }
        ],
        "icon": "build/icon-linux.png",
        "category": "Utility"
    },
    publish: [
        {
            provider: 'generic',
            url: 'https://e8c490b0-8f86-49e6-b849-57f0230dd8a5.selstorage.ru/linux/'
        }
    ],
};
module.exports = config;
