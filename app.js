document.addEventListener("DOMContentLoaded", () => {
    const postsContainer = document.getElementById("posts-container");
    const navContainer = document.getElementById("nav-container");
    const siteTitle = document.getElementById("site-title");
    const siteTagline = document.getElementById("site-tagline");
    const backToTopBtn = document.getElementById("back-to-top");

    // ========================================================
    // 💡 CONFIGURATION: LIVE GOOGLE SHEET CSV ENDPOINT LINK
    // ========================================================
    const SPREADSHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRhYAohsI3t3K_yc9aOc272PKRKJXwwwcwo0Un_qgtP_3yyEhtQ-nNic20tkB197t2DWUHiGIlmPQ52/pub?output=csv";

    // Global Site Navigation & Theme Properties
    const SITE_CONFIG = {
        "siteName": "nourish & flourish",
        "tagline": "Cultivating wellness, inside and out.",
        "navigation": [
            {"label": "Home", "link": "index.html"},
            {"label": "Recipes", "link": "index.html?category=recipes"},
            {"label": "Mindfulness", "link": "index.html?category=mindfulness"},
            {"label": "About", "link": "index.html?page=about"},
            {"label": "Contact", "link": "index.html?page=contact"}
        ]
    };

    // 1. Render Basic UI Layout Framework 
    if (siteTitle) siteTitle.textContent = SITE_CONFIG.siteName;
    if (siteTagline) siteTagline.textContent = SITE_CONFIG.tagline;
    if (navContainer) {
        navContainer.innerHTML = SITE_CONFIG.navigation.map(item => 
            `<a href="${item.link}">${item.label}</a>`
        ).join("");
    }

    // 2. Fetch Live Rows From Google Sheets
    function loadBlogData() {
        fetch(SPREADSHEET_CSV_URL)
            .then(res => {
                if (!res.ok) throw new Error("Database connectivity issue");
                return res.text();
            })
            .then(csvText => {
                const posts = parseCSV(csvText);
                renderBlogFeed(posts);
            })
            .catch(error => {
                console.error("Failed to read database matrix array:", error);
                if (postsContainer) {
                    postsContainer.innerHTML = '<div class="error">Unable to sync articles. Please check your spreadsheet publishing status.</div>';
                }
            });
    }

    loadBlogData();

    // Custom CSV Compiler Engine (Handles paragraphs, quotes, and commas gracefully)
    function parseCSV(text) {
        const lines = [];
        let row = [""];
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            let el = text[i];
            let nextEl = text[i+1];

            if (el === '"') {
                if (inQuotes && nextEl === '"') { row[row.length - 1] += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (el === ',' && !inQuotes) {
                row.push('');
            } else if ((el === '\r' || el === '\n') && !inQuotes) {
                if (el === '\r' && nextEl === '\n') { i++; }
                lines.push(row);
                row = [''];
            } else {
                row[row.length - 1] += el;
            }
        }
        if (row.length > 1 || row[0] !== '') { lines.push(row); }
        if (lines.length === 0) return [];

        const headers = lines[0].map(h => h.trim());
        const result = [];

        for (let i = 1; i < lines.length; i++) {
            const currentRow = lines[i];
            if (currentRow.length < headers.length) continue;
            
            const obj = {};
            headers.forEach((header, idx) => {
                obj[header] = currentRow[idx] ? currentRow[idx].trim() : '';
            });
            result.push(obj);
        }
        return result;
    }

    // 🌟 AUTOMATIC FORMATTER: Converts plain text line breaks into HTML paragraphs dynamically
    function formatToParagraphs(rawText) {
        if (!rawText) return "";
        return rawText
            .split(/\r?\n/)
            .filter(paragraph => paragraph.trim() !== "")
            .map(paragraph => `<p>${paragraph.trim()}</p>`)
            .join("");
    }

    // 3. Dynamic Blog Feed Render Component
    function renderBlogFeed(posts) {
        if (postsContainer && posts.length > 0) {
            // Sort items by ID descending so the newest post ID remains at the top
            const sortedPosts = posts.sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0));

            postsContainer.innerHTML = sortedPosts.map(post => {
                // Process plain text column streams into formatted paragraph containers
                const formattedExcerpt = formatToParagraphs(post.excerpt);
                const formattedContent = formatToParagraphs(post.content);

                return `
                    <article class="post-card" id="post-${post.id}">
                        ${post.image ? `<img src="${post.image}" alt="${post.title}" class="post-image">` : ''}
                        
                        <div class="post-card-content">
                            <span class="post-category">${post.category}</span>
                            <h2><a href="javascript:void(0);" class="toggle-trigger" data-id="${post.id}">${post.title}</a></h2>
                            <div class="post-meta">Shared on <time datetime="${post.datetime}">${post.date}</time></div>
                            
                            <div class="post-excerpt" id="excerpt-${post.id}">
                                ${formattedExcerpt}
                            </div>

                            <div class="full-content" id="content-${post.id}" style="display: none;">
                                ${formattedContent}
                            </div>
                            
                            <a href="javascript:void(0);" class="read-more" data-id="${post.id}">Continue Reading &rarr;</a>
                        </div>
                    </article>
                `;
            }).join("");

            setupReadingToggle();
        } else {
            postsContainer.innerHTML = '<div class="error">No posts found. Add row entries inside your database sheet spreadsheet to show files.</div>';
        }
    }

    // 4. Inline Content Visibility Controller
    function setupReadingToggle() {
        postsContainer.addEventListener("click", (e) => {
            const target = e.target;
            if (target.classList.contains("read-more") || target.classList.contains("toggle-trigger")) {
                e.preventDefault();
                const id = target.getAttribute("data-id");
                const excerptDiv = document.getElementById(`excerpt-${id}`);
                const contentDiv = document.getElementById(`content-${id}`);
                const readMoreBtn = document.querySelector(`.read-more[data-id="${id}"]`);

                if (contentDiv && excerptDiv) {
                    if (contentDiv.style.display === "none") {
                        contentDiv.style.display = "block";
                        excerptDiv.style.display = "none";
                        if (readMoreBtn) readMoreBtn.innerHTML = "&larr; Show Less";
                    } else {
                        contentDiv.style.display = "none";
                        excerptDiv.style.display = "block";
                        if (readMoreBtn) readMoreBtn.innerHTML = "Continue Reading &rarr;";
                        
                        // Smoothly scroll the page window context back up to the top of the reading box
                        document.getElementById(`post-${id}`).scrollIntoView({ behavior: 'smooth' });
                    }
                }
            }
        });
    }

    // 5. Scroll Elevation Tracking Back to Top Module
    if (backToTopBtn) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 400) {
                backToTopBtn.classList.add("visible");
            } else {
                backToTopBtn.classList.remove("visible");
            }
        });
        backToTopBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
});
