document.addEventListener("DOMContentLoaded", () => {
    const postsContainer = document.getElementById("posts-container");
    const navContainer = document.getElementById("nav-container");
    const siteTitle = document.getElementById("site-title");
    const siteTagline = document.getElementById("site-tagline");

    // Fetch blog data from data.json
    fetch("data.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok " + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // 1. Render Brand details
            if(siteTitle) siteTitle.textContent = data.siteName || "nourish & flourish";
            if(siteTagline) siteTagline.textContent = data.tagline || "";

            // 2. Render Navigation Links
            if (navContainer && data.navigation) {
                navContainer.innerHTML = data.navigation.map(item => 
                    `<a href="${item.link}">${item.label}</a>`
                ).join("");
            }

            // 3. Render Blog Posts
            if (postsContainer && data.posts && data.posts.length > 0) {
                postsContainer.innerHTML = data.posts.map(post => `
                    <article class="post-card">
                        <span class="post-category">${post.category}</span>
                        <h2><a href="${post.link}">${post.title}</a></h2>
                        <div class="post-meta">
                            Shared on <time datetime="${post.datetime}">${post.date}</time>
                        </div>
                        <div class="post-content">
                            <p>${post.excerpt}</p>
                        </div>
                        <a href="${post.link}" class="read-more">Continue Reading &rarr;</a>
                    </article>
                `).join("");
            } else {
                postsContainer.innerHTML = '<div class="error">No posts found.</div>';
            }
        })
        .catch(error => {
            console.error("Error loading blog data:", error);
            if(postsContainer) {
                postsContainer.innerHTML = '<div class="error">Unable to load feed at this time. Please try again later.</div>';
            }
        });
});
