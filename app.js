document.addEventListener("DOMContentLoaded", () => {
    const postsContainer = document.getElementById("posts-container");
    const navContainer = document.getElementById("nav-container");
    const siteTitle = document.getElementById("site-title");
    const siteTagline = document.getElementById("site-tagline");
    const backToTopBtn = document.getElementById("back-to-top");

    // 1. Fetch JSON Content Layer
    fetch("data.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Network configuration problem: " + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // Set brand configurations
            if (siteTitle) siteTitle.textContent = data.siteName || "nourish & flourish";
            if (siteTagline) siteTagline.textContent = data.tagline || "";

            // FIXED: Changed item.url to item.link to match data.json precisely
            if (navContainer && data.navigation) {
                navContainer.innerHTML = data.navigation.map(item => 
                    `<a href="${item.link}">${item.label}</a>`
                ).join("");
            }

            // Render Post Collection Elements
            if (postsContainer && data.posts && data.posts.length > 0) {
                postsContainer.innerHTML = data.posts.map(post => `
                    <article class="post-card" id="post-${post.id}">
                        ${post.image ? `<img src="${post.image}" alt="${post.title}" class="post-image">` : ''}
                        
                        <div class="post-card-content">
                            <span class="post-category">${post.category}</span>
                            
                            <h2><a href="javascript:void(0);" class="toggle-trigger" data-id="${post.id}">${post.title}</a></h2>
                            <div class="post-meta">Shared on <time datetime="${post.datetime}">${post.date}</time></div>
                            
                            <div class="post-excerpt" id="excerpt-${post.id}">
                                <p>${post.excerpt}</p>
                            </div>

                            <div class="full-content" id="content-${post.id}" style="display: none;">
                                ${post.content}
                            </div>
                            
                            <a href="javascript:void(0);" class="read-more" data-id="${post.id}">Continue Reading &rarr;</a>
                        </div>
                    </article>
                `).join("");

                // Setup events after structural rendering
                setupReadingToggle();
            } else {
                postsContainer.innerHTML = '<div class="error">No posts found.</div>';
            }
        })
        .catch(error => {
            console.error("Runtime fetch failed:", error);
            if (postsContainer) {
                postsContainer.innerHTML = '<div class="error">Unable to build feed at this moment.</div>';
            }
        });

    // 2. Inline Visibility Logic Container
    function setupReadingToggle() {
        postsContainer.addEventListener("click", (e) => {
            // Target tracking check
            if (e.target.classList.contains("read-more") || e.target.classList.contains("toggle-trigger")) {
                e.preventDefault();
                
                const postId = e.target.getAttribute("data-id");
                const excerptDiv = document.getElementById(`excerpt-${postId}`);
                const contentDiv = document.getElementById(`content-${postId}`);
                const readMoreBtn = document.querySelector(`.read-more[data-id="${postId}"]`);
                
                if (contentDiv && excerptDiv) {
                    if (contentDiv.style.display === "none") {
                        contentDiv.style.display = "block";
                        excerptDiv.style.display = "none";
                        if (readMoreBtn) readMoreBtn.innerHTML = "&larr; Show Less";
                    } else {
                        contentDiv.style.display = "none";
                        excerptDiv.style.display = "block";
                        if (readMoreBtn) readMoreBtn.innerHTML = "Continue Reading &rarr;";
                        
                        document.getElementById(`post-${postId}`).scrollIntoView({ behavior: 'smooth' });
                    }
                }
            }
        });
    }

    // 3. Back to Top Component
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
