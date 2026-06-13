document.addEventListener("DOMContentLoaded", () => {
    const postsContainer = document.getElementById("posts-container");
    const searchBar = document.getElementById("search-bar");
    const backToTopBtn = document.getElementById("back-to-top");

    // Connected to your live Apps Script bridge
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwONYUrHDhRXw8-YI1SUFMwIydXOr9IBXbU1yayFOZsWxZl6pyKZbjBstvJSNWk6-NE/exec";
    
    let allPosts = []; // Master array for the search filter

    // 1. Fetch JSON Data from your Apps Script
    function loadBlogData() {
        fetch(APPS_SCRIPT_URL)
            .then(res => res.json())
            .then(data => {
                // Sort backwards so newest ID is at the top
                allPosts = data.sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0));
                renderBlogFeed(allPosts);
            })
            .catch(error => {
                postsContainer.innerHTML = '<div class="error">Database communication issue. Please check API link.</div>';
            });
    }

    loadBlogData();

    // 2. Real-Time Search Engine Listener
    if (searchBar) {
        searchBar.addEventListener("input", (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allPosts.filter(post => 
                (post.title && post.title.toLowerCase().includes(term)) || 
                (post.content && post.content.toLowerCase().includes(term)) ||
                (post.category && post.category.toLowerCase().includes(term))
            );
            renderBlogFeed(filtered);
        });
    }

    // 3. Format Plain Text to HTML Paragraphs seamlessly
    function formatToParagraphs(rawText) {
        if (!rawText) return "";
        return rawText.split(/\r?\n/).filter(p => p.trim() !== "").map(p => `<p>${p.trim()}</p>`).join("");
    }

    // 4. Render Blog Feed (With Likes & Comments UI)
    function renderBlogFeed(posts) {
        if (!postsContainer) return;
        if (posts.length === 0) {
            postsContainer.innerHTML = '<div class="error">No articles found matching your search.</div>';
            return;
        }

        postsContainer.innerHTML = posts.map(post => {
            // Safely parse the comments JSON string from the sheet
            let comments = [];
            try { if (post.comments && post.comments !== "[]") comments = JSON.parse(post.comments); } 
            catch(e) { comments = []; }
            
            const likes = post.likes || 0;

            return `
            <article class="post-card" id="post-${post.id}">
                ${post.image ? `<img src="${post.image}" alt="${post.title}" class="post-image">` : ''}
                <div class="post-card-content">
                    <span class="post-category">${post.category}</span>
                    <h2><a href="javascript:void(0);" class="toggle-trigger" data-id="${post.id}">${post.title}</a></h2>
                    <div class="post-meta">Shared on <time>${post.date}</time></div>
                    
                    <div class="post-excerpt" id="excerpt-${post.id}">
                        ${formatToParagraphs(post.excerpt)}
                    </div>
                    
                    <div class="full-content" id="content-${post.id}" style="display: none;">
                        ${formatToParagraphs(post.content)}
                        
                        <div class="engagement-bar">
                            <button class="btn-like" data-id="${post.id}">❤️ Love this! (${likes})</button>
                        </div>

                        <div class="comments-section">
                            <h3>Community Thoughts (${comments.length})</h3>
                            <div class="comments-list">
                                ${comments.map(c => `
                                    <div class="comment-item">
                                        <strong>${c.name}</strong> <span>${c.timestamp}</span>
                                        <p>${c.text}</p>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="add-comment-box">
                                <input type="text" id="comment-name-${post.id}" placeholder="Your Name">
                                <textarea id="comment-text-${post.id}" rows="2" placeholder="Share your thoughts..."></textarea>
                                <button class="btn-submit-comment" data-id="${post.id}">Post Comment</button>
                            </div>
                        </div>

                    </div>
                    
                    <a href="javascript:void(0);" class="read-more" data-id="${post.id}">Continue Reading &rarr;</a>
                </div>
            </article>
        `}).join("");
    }

    // 5. Global Click Router (Handles Expand, Likes, and Comments)
    postsContainer.addEventListener("click", (e) => {
        const target = e.target;
        const id = target.getAttribute("data-id");

        // Expand/Collapse Article
        if (target.classList.contains("read-more") || target.classList.contains("toggle-trigger")) {
            e.preventDefault();
            const excerpt = document.getElementById(`excerpt-${id}`);
            const content = document.getElementById(`content-${id}`);
            const btn = document.querySelector(`.read-more[data-id="${id}"]`);
            
            if (content.style.display === "none") {
                content.style.display = "block"; 
                excerpt.style.display = "none"; 
                if(btn) btn.innerHTML = "&larr; Show Less";
            } else {
                content.style.display = "none"; 
                excerpt.style.display = "block"; 
                if(btn) btn.innerHTML = "Continue Reading &rarr;";
                document.getElementById(`post-${id}`).scrollIntoView({ behavior: 'smooth' });
            }
        }

        // Handle Liking
        if (target.classList.contains("btn-like")) {
            target.innerHTML = "Processing...";
            target.disabled = true;
            postDataToAPI({ action: "like", id: id }).then(() => loadBlogData());
        }

        // Handle Commenting
        if (target.classList.contains("btn-submit-comment")) {
            const nameField = document.getElementById(`comment-name-${id}`);
            const textField = document.getElementById(`comment-text-${id}`);
            
            if(!nameField.value || !textField.value) {
                alert("Please fill out both your name and comment.");
                return;
            }
            
            target.innerHTML = "Posting...";
            target.disabled = true;
            postDataToAPI({ action: "addComment", id: id, name: nameField.value, text: textField.value })
                .then(() => loadBlogData());
        }
    });

    // 6. Universal API Poster Function (Uses text/plain to avoid CORS)
    async function postDataToAPI(payload) {
        return fetch(APPS_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(payload)
        });
    }

    // 7. Scroll Elevation Back to Top
    if (backToTopBtn) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 400) backToTopBtn.classList.add("visible");
            else backToTopBtn.classList.remove("visible");
        });
        backToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
});
