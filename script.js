// Animation on scroll for content sections
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all sections with animate-on-scroll class
document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
});

// Lazy Loading for GIFs using Intersection Observer
const lazyGifOptions = {
    root: null,
    rootMargin: '200px', // Start loading 200px before entering viewport
    threshold: 0.01
};

const lazyGifObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            
            // Check if image has data-src (not yet loaded)
            if (img.dataset.src) {
                // Create a placeholder while loading
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.3s ease-in';
                
                // Load the actual GIF
                img.src = img.dataset.src;
                
                // When loaded, fade in and remove data-src
                img.onload = () => {
                    img.style.opacity = '1';
                    img.classList.add('lazy-loaded');
                    delete img.dataset.src;
                };
                
                // Stop observing this image
                observer.unobserve(img);
            }
        }
    });
}, lazyGifOptions);

// Observe all lazy GIFs
document.addEventListener('DOMContentLoaded', () => {
    const lazyGifs = document.querySelectorAll('.lazy-gif');
    lazyGifs.forEach(gif => {
        // Add initial styling - aspect-ratio in CSS handles dimensions
        if (gif.dataset.src) {
            gif.style.backgroundColor = '#f0f0f0'; // Placeholder background
        }
        lazyGifObserver.observe(gif);
    });
    
    console.log(`🎯 Lazy loading initialized for ${lazyGifs.length} GIFs`);
});

// Toggle task card collapse/expand
function toggleTask(element) {
    const taskCard = element.closest('.task-card');
    taskCard.classList.toggle('collapsed');
}

// Toggle workflow card collapse/expand
function toggleWorkflow(element) {
    const workflowCard = element.closest('.workflow-card');
    workflowCard.classList.toggle('collapsed');
}

// Header Carousel Functionality
let currentSlide = 0;
let autoSlideInterval;
const slides = document.querySelectorAll('.carousel-image');
const indicators = document.querySelectorAll('.indicator');
const rocketLaunchVideo = document.getElementById('rocket-launch-video');
const headerRocketVideo = document.getElementById('header-rocket-video');

// Slide durations: video plays through once (no timer), static images stay for 3 seconds
const slideDurations = [null, 3000, null, 3000]; // milliseconds (null for videos - use 'ended' event instead)

function showSlide(index) {
    // Update indicators immediately
    indicators.forEach(indicator => indicator.classList.remove('active'));
    indicators[index].classList.add('active');
    
    // Add active class to new slide first (for cross-fade)
    slides[index].classList.add('active');
    
    // Remove active from other slides after a brief moment (for cross-fade effect)
    slides.forEach((slide, i) => {
        if (i !== index) {
            slide.classList.remove('active');
        }
    });
    
    currentSlide = index;
    
    // If switching to rocket launch video (index 0), restart it
    if (index === 0 && rocketLaunchVideo) {
        rocketLaunchVideo.currentTime = 0;
        rocketLaunchVideo.play();
    }
    
    // If switching to header rocket video (index 2), restart it
    if (index === 2 && headerRocketVideo) {
        headerRocketVideo.currentTime = 0;
        headerRocketVideo.play();
    }
    
    // Reset auto-slide timer with appropriate duration
    resetAutoSlide();
}

function changeSlide(direction) {
    let newIndex = currentSlide + direction;
    
    // Wrap around
    if (newIndex < 0) {
        newIndex = slides.length - 1;
    } else if (newIndex >= slides.length) {
        newIndex = 0;
    }
    
    showSlide(newIndex);
}

function goToSlide(index) {
    showSlide(index);
}

function nextSlide() {
    changeSlide(1);
}

function resetAutoSlide() {
    // Clear existing interval
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
    }
    
    // Set new interval with duration specific to current slide
    // For video (index 0), don't set interval - use 'ended' event instead
    const duration = slideDurations[currentSlide];
    if (duration !== null) {
        autoSlideInterval = setInterval(nextSlide, duration);
    }
}

// Video ended event listeners - auto advance to next slide
if (rocketLaunchVideo) {
    rocketLaunchVideo.addEventListener('ended', function() {
        if (currentSlide === 0) {
            nextSlide();
        }
    });
}

if (headerRocketVideo) {
    headerRocketVideo.addEventListener('ended', function() {
        if (currentSlide === 2) {
            nextSlide();
        }
    });
}

// Initialize carousel on page load
document.addEventListener('DOMContentLoaded', function() {
    // Start from the first slide (video) on page refresh
    showSlide(0);
});

// Pause carousel on hover (optional enhancement)
const carouselContainer = document.querySelector('.carousel-container');
if (carouselContainer) {
    carouselContainer.addEventListener('mouseenter', () => {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
        }
        // Also pause videos if they're playing
        if (currentSlide === 0 && rocketLaunchVideo) {
            rocketLaunchVideo.pause();
        }
        if (currentSlide === 2 && headerRocketVideo) {
            headerRocketVideo.pause();
        }
    });
    
    carouselContainer.addEventListener('mouseleave', () => {
        // Resume videos if on video slides
        if (currentSlide === 0 && rocketLaunchVideo) {
            rocketLaunchVideo.play();
        }
        if (currentSlide === 2 && headerRocketVideo) {
            headerRocketVideo.play();
        }
        resetAutoSlide();
    });
}

