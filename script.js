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
const headerVideo = document.getElementById('header-video');

// Slide durations: video plays through once (no timer), static images stay for 3 seconds
const slideDurations = [null, 3000, 3000]; // milliseconds (null for video - use 'ended' event instead)

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
    
    // If switching to video, restart it
    if (index === 0 && headerVideo) {
        headerVideo.currentTime = 0;
        headerVideo.play();
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

// Video ended event listener - auto advance to next slide
if (headerVideo) {
    headerVideo.addEventListener('ended', function() {
        if (currentSlide === 0) {
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
        // Also pause video if it's playing
        if (currentSlide === 0 && headerVideo) {
            headerVideo.pause();
        }
    });
    
    carouselContainer.addEventListener('mouseleave', () => {
        // Resume video if on video slide
        if (currentSlide === 0 && headerVideo) {
            headerVideo.play();
        }
        resetAutoSlide();
    });
}

