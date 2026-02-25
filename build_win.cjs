const config = {
    "appId": "com.rega.desktop",
    "productName": "REGA Desktop",
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
    publish: [
        {
            provider: 'generic',
            url: 'https://e8c490b0-8f86-49e6-b849-57f0230dd8a5.selstorage.ru/windows/'
        }
    ],
};
module.exports = config;
