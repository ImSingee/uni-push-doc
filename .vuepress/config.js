module.exports = {
    title: 'Uni Push',
    description: 'Happy Pushing',
    dest: 'dist',
    themeConfig: {
        nav: [
            { text: '指南', link: '/guide.html' },
            { text: '配置', link: '/settings.html' },
            { text: 'API', link: '/api.html' },
        ],
        repo: 'ImSingee/uni-push-backend',
        docsRepo: 'ImSingee/uni-push-doc',
        editLinks: true,
        editLinkText: '帮助我们改善此页面！',
        lastUpdated: '上次更新',
        sidebar: [
            '/guide',
        ]
    }
}