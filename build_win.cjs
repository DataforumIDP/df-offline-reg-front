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
            provider: 's3',
            bucket: 'rega-update',   // => ваш бакет
            path: 'windows',                     // опционально — префикс в бакете
            region: 'ru-1',              // ваш регион
            endpoint: 's3.ru-1.storage.selcloud.ru',
            acl: 'public-read'                   // если файлы публичные
        }
    ],
};
module.exports = config;
