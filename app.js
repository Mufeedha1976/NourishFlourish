document.addEventListener("DOMContentLoaded", () => {
    const postsContainer = document.getElementById("posts-container");
    const navContainer = document.getElementById("nav-container");
    const siteTitle = document.getElementById("site-title");
    const siteTagline = document.getElementById("site-tagline");

    // Fetch config and post array values directly using a clean relative path
    fetch("data.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response encountered an error: " + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // 1. Map and Parse Brand configuration variables
            if (siteTitle) siteTitle.textContent = data.siteName || "nourish & flourish";
            if (siteTagline) siteTagline.textContent = data.tagline || "";

            // 2. Generate Brand Navigation Elements 
            if (navContainer && data.navigation) {
                navContainer.innerHTML = data.navigation.map(item => 
                    `<a href="${item.link}">${item.label}</a>`
                ).join("");
            }

            // 3. Populate Main Blog Feed Component
            if (postsContainer && data.posts && data.posts.length > 0) {
                postsContainer.innerHTML = data.posts.map(post => `
                    <article class="post-card">
                        ${post.image ? `<img src="${post.image}" alt="${post.title}" class="post-image">` : ''}
                        
                        <div class="post-card-content">
                            <span class="post-category">${post.category}</span>
                            <h2><a href="${post.link}">${post.title}</a></h2>
                            <div class="post-meta">
                                Shared on <time datetime="${post.datetime}">${post.date}</time>
                            </div>
                            <div class="post-content">
                                <p>${post.excerpt}</p>
                            </div>
                                <a href="javascript:void(0);" class="read-more" data-id="${post.id}">Continue Reading &rarr;</a>
                        </div>
                    </article>
                `).join("");
            } else {
                postsContainer.innerHTML = '<div class="error">No published articles found.</div>';
            }
        })
        .catch(error => {
            console.error("Data tracking process failure:", error);
            if (postsContainer) {
                postsContainer.innerHTML = '<div class="error">Unable to sync stories at this time. Please pull down to refresh.</div>';
            }
        });
});
