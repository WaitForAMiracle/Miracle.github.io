let articles = [];
let currentArticle = null;

function toggleMenu() {
    const navLinks = document.querySelector('.blog-nav .nav-links');
    navLinks.classList.toggle('show');
}

async function loadArticles() {
    try {
        const response = await fetch('data/articles.json');
        if (response.ok) {
            const data = await response.json();
            articles = data.articles || [];
        }
    } catch (error) {
        console.log('加载文章数据失败');
        articles = [];
    }
    loadCurrentArticle();
}

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function loadCurrentArticle() {
    const articleId = parseInt(getUrlParameter('id'));
    currentArticle = articles.find(a => a.id === articleId);
    
    if (!currentArticle) {
        document.getElementById('articleBody').innerHTML = `
            <div style="text-align: center; padding: 4rem;">
                <i class="fas fa-exclamation-circle" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <p style="color: var(--text-secondary); font-size: 1.2rem;">文章不存在</p>
            </div>
        `;
        return;
    }
    
    renderArticle();
}

function renderArticle() {
    document.getElementById('page-title').textContent = currentArticle.title + " - Miracle's Blog";
    document.getElementById('articleTitle').textContent = currentArticle.title;
    
    document.getElementById('articleMeta').innerHTML = `
        <span><i class="fas fa-calendar-alt"></i> ${currentArticle.date}</span>
        <span><i class="fas fa-user"></i> ${currentArticle.author}</span>
        <span><i class="fas fa-clock"></i> ${currentArticle.readTime}</span>
        <span><i class="fas fa-folder"></i> ${currentArticle.categoryName}</span>
    `;
    
    document.getElementById('articleTags').innerHTML = currentArticle.tags
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');
    
    document.getElementById('articleBody').innerHTML = currentArticle.content;
    
    generateTOC();
    setupReadingProgress();
    renderArticleNav();
    
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
}

function generateTOC() {
    const body = document.getElementById('articleBody');
    const headings = body.querySelectorAll('h2, h3');
    const tocContent = document.getElementById('tocContent');
    
    if (headings.length === 0) {
        tocContent.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">暂无目录</p>';
        return;
    }
    
    let tocHTML = '';
    headings.forEach((heading, index) => {
        const level = heading.tagName.toLowerCase();
        const id = `heading-${index}`;
        heading.id = id;
        
        const text = heading.textContent;
        tocHTML += `
            <a href="#${id}" class="toc-item level-${level.replace('h', '')}" data-target="${id}">
                ${text}
            </a>
        `;
    });
    
    tocContent.innerHTML = tocHTML;
    
    setupTOCHighlight();
}

function setupTOCHighlight() {
    const tocItems = document.querySelectorAll('.toc-item');
    const headings = document.querySelectorAll('#articleBody h2, #articleBody h3');
    
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                tocItems.forEach(item => item.classList.remove('active'));
                const activeItem = document.querySelector(`.toc-item[data-target="${id}"]`);
                if (activeItem) {
                    activeItem.classList.add('active');
                }
            }
        });
    }, observerOptions);
    
    headings.forEach(heading => observer.observe(heading));
}

function setupReadingProgress() {
    const progressBar = document.getElementById('progressBar');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;
        progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    });
}

function renderArticleNav() {
    const currentIndex = articles.findIndex(a => a.id === currentArticle.id);
    const prevArticle = currentIndex > 0 ? articles[currentIndex - 1] : null;
    const nextArticle = currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null;
    
    const articleNav = document.getElementById('articleNav');
    let navHTML = '';
    
    if (prevArticle) {
        navHTML += `
            <a href="article.html?id=${prevArticle.id}" class="article-nav-link prev">
                <div class="article-nav-label">
                    <i class="fas fa-chevron-left"></i> 上一篇
                </div>
                <div class="article-nav-title">${prevArticle.title}</div>
            </a>
        `;
    } else {
        navHTML += '<div></div>';
    }
    
    if (nextArticle) {
        navHTML += `
            <a href="article.html?id=${nextArticle.id}" class="article-nav-link next">
                <div class="article-nav-label">
                    下一篇 <i class="fas fa-chevron-right"></i>
                </div>
                <div class="article-nav-title">${nextArticle.title}</div>
            </a>
        `;
    }
    
    articleNav.innerHTML = navHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    loadArticles();
});
