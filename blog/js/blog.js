let articles = [];
let currentCategory = 'all';
let currentPage = 1;
let searchQuery = '';
const articlesPerPage = 9;

const categoryNames = {
    all: '全部文章',
    frontend: '前端开发',
    backend: '后端开发',
    ai: 'AI/机器学习',
    cloud: '云原生/DevOps',
    other: '其他'
};

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
        console.log('加载文章数据失败，使用默认数据');
        articles = [];
    }
    updateCategoryCounts();
    renderArticles();
}

function updateCategoryCounts() {
    const counts = {
        all: articles.length,
        frontend: articles.filter(a => a.category === 'frontend').length,
        backend: articles.filter(a => a.category === 'backend').length,
        ai: articles.filter(a => a.category === 'ai').length,
        cloud: articles.filter(a => a.category === 'cloud').length,
        other: articles.filter(a => a.category === 'other').length
    };
    
    Object.keys(counts).forEach(category => {
        const countEl = document.getElementById(`count-${category}`);
        if (countEl) {
            countEl.textContent = counts[category];
        }
    });
}

function filterArticles() {
    let filtered = articles;
    
    if (currentCategory !== 'all') {
        filtered = filtered.filter(article => article.category === currentCategory);
    }
    
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(article => 
            article.title.toLowerCase().includes(query) ||
            article.excerpt.toLowerCase().includes(query) ||
            article.tags.some(tag => tag.toLowerCase().includes(query))
        );
    }
    
    return filtered;
}

function renderArticles() {
    const filtered = filterArticles();
    const totalPages = Math.ceil(filtered.length / articlesPerPage);
    
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }
    
    const start = (currentPage - 1) * articlesPerPage;
    const end = start + articlesPerPage;
    const pageArticles = filtered.slice(start, end);
    
    const grid = document.getElementById('articlesGrid');
    const sectionTitle = document.getElementById('sectionTitle');
    const articleCount = document.getElementById('articleCount');
    
    sectionTitle.textContent = categoryNames[currentCategory];
    articleCount.textContent = `${filtered.length} 篇文章`;
    
    if (pageArticles.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary);">
                <i class="fas fa-search" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>没有找到相关文章</p>
            </div>
        `;
    } else {
        grid.innerHTML = pageArticles.map(article => createArticleCard(article)).join('');
    }
    
    renderPagination(filtered.length, totalPages);
}

function createArticleCard(article) {
    const coverImage = article.coverImage || getDefaultCover(article.category);
    const categoryIcon = getCategoryIcon(article.category);
    
    return `
        <div class="article-card" onclick="viewArticle(${article.id})">
            <div class="card-image">
                ${coverImage ? `<img src="${coverImage}" alt="${article.title}" loading="lazy">` : `<i class="${categoryIcon}"></i>`}
            </div>
            <div class="card-content">
                <div class="card-meta">
                    <span><i class="fas fa-calendar-alt"></i> ${article.date}</span>
                    <span><i class="fas fa-clock"></i> ${article.readTime}</span>
                </div>
                <h3 class="card-title">${article.title}</h3>
                <p class="card-excerpt">${article.excerpt}</p>
                <div class="card-tags">
                    ${article.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
}

function getCategoryIcon(category) {
    const icons = {
        frontend: 'fab fa-react',
        backend: 'fas fa-server',
        ai: 'fas fa-brain',
        cloud: 'fas fa-cloud',
        other: 'fas fa-lightbulb'
    };
    return icons[category] || 'fas fa-file-alt';
}

function getDefaultCover(category) {
    return null;
}

function viewArticle(articleId) {
    window.location.href = `article.html?id=${articleId}`;
}

function renderPagination(total, totalPages) {
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    html += `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<button onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            html += `<button disabled>...</button>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button onclick="changePage(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<button disabled>...</button>`;
        }
        html += `<button onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    html += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
    
    pagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    renderArticles();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupCategoryFilter() {
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            categoryItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentCategory = item.dataset.category;
            currentPage = 1;
            renderArticles();
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchQuery = e.target.value.trim();
            currentPage = 1;
            renderArticles();
        }, 300);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupCategoryFilter();
    setupSearch();
    loadArticles();
});