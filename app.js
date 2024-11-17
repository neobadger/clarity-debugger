// app.js

document.addEventListener('DOMContentLoaded', () => {
  // Selecting DOM Elements
  const accordions = document.querySelectorAll('.accordion');
  const saveBaseUrlBtn = document.getElementById('saveBaseUrlBtn');
  const baseUrlInput = document.getElementById('baseUrl');

  // Generate URL Elements
  const urlForm = document.getElementById('urlForm');
  const emailInput = document.getElementById('email');
  const sessionIdInput = document.getElementById('sessionId');
  const charCounter = document.getElementById('charCounter');
  const generatedUrlInput = document.getElementById('generatedUrl');
  const copyBtn = document.getElementById('copyBtn');
  const outputSection = document.getElementById('output');

  // Generate Email Hash Elements
  const hashForm = document.getElementById('hashForm');
  const hashEmailInput = document.getElementById('hashEmail');
  const generatedHashInput = document.getElementById('generatedHash');
  const copyHashBtn = document.getElementById('copyHashBtn');
  const hashOutputSection = document.getElementById('hashOutput');
  const editHashBtn = document.getElementById('editHashBtn'); // Ensure this ID exists in your HTML

  // Buttons
  const generateUrlBtn = urlForm.querySelector('button[type="submit"]');
  const generateHashBtn = hashForm.querySelector('button[type="submit"]');

  // Constants
  const SESSION_ID_MAX = 25;
  const FEEDBACK_DURATION = 2000; // 2 seconds

  // Function to update Base URL button text and input state
  const updateBaseUrlState = () => {
    const savedBaseUrl = localStorage.getItem('baseUrl');
    if (savedBaseUrl) {
      saveBaseUrlBtn.textContent = 'Remove Base URL';
      baseUrlInput.value = savedBaseUrl;
      baseUrlInput.disabled = true;
    } else {
      saveBaseUrlBtn.textContent = 'Set Base URL';
      baseUrlInput.value = '';
      baseUrlInput.disabled = false;
    }
  };

  // Function to show inline feedback on the button
  const showButtonFeedback = (button, message, color) => {
    button.textContent = message;
    button.style.backgroundColor = color;

    // Revert back to the appropriate text and color after FEEDBACK_DURATION
    setTimeout(() => {
      updateBaseUrlState();
      button.style.backgroundColor = ''; // Revert to original color
    }, FEEDBACK_DURATION);
  };

  // Function to validate URL
  const isValidURL = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Function to handle accordion behavior
  const handleAccordions = () => {
    accordions.forEach((accordion) => {
      accordion.addEventListener('click', function () {
        // Check if the clicked accordion is already active
        const isActive = this.classList.contains('active');

        // Close all panels
        accordions.forEach((acc) => {
          acc.classList.remove('active');
          acc.setAttribute('aria-expanded', 'false');
          const panel = acc.nextElementSibling;
          panel.classList.remove('active');
          panel.style.maxHeight = null;
        });

        // If the clicked accordion was not active, open it
        if (!isActive) {
          this.classList.add('active');
          this.setAttribute('aria-expanded', 'true');
          const panel = this.nextElementSibling;
          panel.classList.add('active');
          // Adding 40px as per your fix to prevent cutoff
          panel.style.maxHeight = 40 + panel.scrollHeight + 'px';
        }
      });
    });
  };

  // Function to hash email using SHA-256 and return Base64 encoded string
  const hashEmail = async (email) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(email);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));
    // Optionally, truncate the hash to 24 characters to reduce length
    return hashBase64.substring(0, 24);
  };

  // Initial state on page load
  updateBaseUrlState();

  // Handle Base URL Set/Remove
  saveBaseUrlBtn.addEventListener('click', (event) => {
    // Prevent the click from bubbling up to the accordion
    event.stopPropagation();

    const baseUrl = baseUrlInput.value.trim();
    const savedBaseUrl = localStorage.getItem('baseUrl');

    if (savedBaseUrl) {
      // Remove Base URL from localStorage
      localStorage.removeItem('baseUrl');
      showButtonFeedback(saveBaseUrlBtn, 'Base URL Cleared', 'tomato');
    } else if (baseUrl) {
      // Validate URL before saving
      if (isValidURL(baseUrl)) {
        // Save the Base URL to localStorage
        localStorage.setItem('baseUrl', baseUrl);
        showButtonFeedback(saveBaseUrlBtn, 'URL Set', 'green');
      } else {
        // Provide feedback for invalid URL
        showButtonFeedback(saveBaseUrlBtn, 'Invalid URL', 'red');
      }
    }
  });

  // Handle Generate URL Form Submission
  urlForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const sessionId = sessionIdInput.value.trim();
    const baseUrl = localStorage.getItem('baseUrl') || '';

    if (!baseUrl) {
      alert('Please set the Base URL before generating the URL.');
      return;
    }

    if (!email || !sessionId) {
      alert('Please fill in both User Email and Session ID.');
      return;
    }

    if (generateUrlBtn.textContent === 'Generate URL') {
      // Generate the hashed email
      const hashedEmail = await hashEmail(email);

      // Generate the URL with hashed email
      const encodedEmail = encodeURIComponent(hashedEmail);
      const encodedSessionId = encodeURIComponent(sessionId);
      const generatedUrl = `${baseUrl}?neo_debug=true&neo_cuid=${encodedEmail}&neo_csid=${encodedSessionId}`;
      generatedUrlInput.value = generatedUrl;

      // Hide input fields
      emailInput.style.display = 'none';
      sessionIdInput.style.display = 'none';
      charCounter.style.display = 'none';

      // Show output section
      outputSection.style.display = 'flex';

      // Change button text to "Edit Details"
      generateUrlBtn.textContent = 'Edit Details';
    } else if (generateUrlBtn.textContent === 'Edit Details') {
      // Show input fields
      emailInput.style.display = 'block';
      sessionIdInput.style.display = 'block';
      charCounter.style.display = 'block';

      // Hide output section
      outputSection.style.display = 'none';

      // Change button text back to "Generate URL"
      generateUrlBtn.textContent = 'Generate URL';
    }
  });

  // Handle Copy to Clipboard for URL
  copyBtn.addEventListener('click', (event) => {
    // Prevent the click from bubbling up to the accordion
    event.stopPropagation();

    const url = generatedUrlInput.value;
    if (!url) return;

    // Copy the URL to clipboard
    navigator.clipboard.writeText(url).then(
      () => {
        // Provide feedback to the user
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.disabled = true;
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.disabled = false;
        }, FEEDBACK_DURATION);
      },
      () => {
        // Handle errors
        copyBtn.textContent = 'Failed to Copy';
        setTimeout(() => {
          copyBtn.textContent = 'Copy to Clipboard';
        }, FEEDBACK_DURATION);
      }
    );
  });

  // Handle Copy to Clipboard for Email Hash
  copyHashBtn.addEventListener('click', (event) => {
    // Prevent the click from bubbling up to the accordion
    event.stopPropagation();

    const hash = generatedHashInput.value;
    if (!hash) return;

    // Copy the hash to clipboard
    navigator.clipboard.writeText(hash).then(
      () => {
        // Provide feedback to the user
        const originalText = copyHashBtn.textContent;
        copyHashBtn.textContent = 'Copied!';
        copyHashBtn.disabled = true;
        setTimeout(() => {
          copyHashBtn.textContent = originalText;
          copyHashBtn.disabled = false;
        }, FEEDBACK_DURATION);
      },
      () => {
        // Handle errors
        copyHashBtn.textContent = 'Failed to Copy';
        setTimeout(() => {
          copyHashBtn.textContent = 'Copy to Clipboard';
        }, FEEDBACK_DURATION);
      }
    );
  });

  // Handle Generate Email Hash Form Submission
  hashForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = hashEmailInput.value.trim();

    if (!email) {
      alert('Please enter an email to hash.');
      return;
    }

    // Generate the hashed email
    const hashedEmail = await hashEmail(email);
    generatedHashInput.value = hashedEmail;

    // Hide the entire form
    hashForm.style.display = 'none';

    // Show the hashOutputSection
    hashOutputSection.style.display = 'flex';

    // Ensure the Edit Email button is visible
    editHashBtn.style.display = 'inline-block';

    // Change the "Generate Hash" button to disabled to prevent further submissions
    generateHashBtn.disabled = true;
  });

  // Handle Edit Email Button Click
  editHashBtn.addEventListener('click', (event) => {
    // Prevent the click from bubbling up to the accordion
    event.stopPropagation();

    // Show the hashForm
    hashForm.style.display = 'flex';

    // Hide the hashOutputSection
    hashOutputSection.style.display = 'none';

    // Clear the generated hash input
    generatedHashInput.value = '';

    // Enable the "Generate Hash" button again
    generateHashBtn.disabled = false;
  });

  // Character Counter for Session ID
  sessionIdInput.addEventListener('input', () => {
    const remaining = SESSION_ID_MAX - sessionIdInput.value.length;
    charCounter.textContent = `${remaining} character${
      remaining !== 1 ? 's' : ''
    } left`;
  });

  // Handle Accordion Behavior
  handleAccordions();

  // Automatically open the settings accordion if no Base URL is saved
  const toggleAccordionOnLoad = () => {
    const savedBaseUrl = localStorage.getItem('baseUrl');
    if (!savedBaseUrl) {
      // Find the first accordion button (Base URL Settings)
      const firstAccordion = accordions[0];
      firstAccordion.classList.add('active');
      firstAccordion.setAttribute('aria-expanded', 'true');
      const firstPanel = firstAccordion.nextElementSibling;
      firstPanel.classList.add('active');
      firstPanel.style.maxHeight = 40 + firstPanel.scrollHeight + 'px';
    }
  };

  // Initialization Function
  const init = () => {
    toggleAccordionOnLoad();
    // Update character counter in case of pre-filled values
    const remaining = SESSION_ID_MAX - sessionIdInput.value.length;
    charCounter.textContent = `${remaining} character${
      remaining !== 1 ? 's' : ''
    } left`;

    // Initially hide output sections
    outputSection.style.display = 'none';
    hashOutputSection.style.display = 'none';
    editHashBtn.style.display = 'none'; // Hide Edit Email button initially
  };

  // Run initialization
  init();
});
