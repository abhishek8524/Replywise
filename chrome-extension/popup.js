const API_URL = 'http://localhost:8080/api';
let currentReply = null;
let currentRiskAnalysis = null;
let selectedTone = 'professional';

// DOM Elements
const emailTextArea = document.getElementById('emailText');
const contextArea = document.getElementById('context');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const shareBtn = document.getElementById('shareBtn');
const editBtn = document.getElementById('editBtn');
const backBtn = document.getElementById('backBtn');
const sendShareBtn = document.getElementById('sendShareBtn');
const saveEditBtn = document.getElementById('saveEditBtn');

// Sections
const formSection = document.getElementById('form-section');
const loadingSection = document.getElementById('loading-section');
const resultSection = document.getElementById('result-section');
const shareSection = document.getElementById('share-section');
const editSection = document.getElementById('edit-section');
const errorSection = document.getElementById('error-section');

// Tone selection
document.querySelectorAll('.tone-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedTone = btn.dataset.tone;
  });
});

generateBtn.addEventListener('click', generateReply);
copyBtn.addEventListener('click', copyReply);
shareBtn.addEventListener('click', showShareSection);
editBtn.addEventListener('click', showEditSection);
backBtn.addEventListener('click', showFormSection);
sendShareBtn.addEventListener('click', sendForReview);
saveEditBtn.addEventListener('click', saveEdit);
document.getElementById('backFromShareBtn').addEventListener('click', showResultSection);
document.getElementById('backFromEditBtn').addEventListener('click', showResultSection);
document.getElementById('closeErrorBtn').addEventListener('click', showFormSection);

async function generateReply() {
  const emailText = emailTextArea.value.trim();
  const context = contextArea.value.trim();

  if (!emailText) {
    showError('Please enter the email text');
    return;
  }

  console.log('Generate button clicked');
  showLoadingSection();
  console.log('Loading section shown');

  try {
    const payload = {
      emailText,
      context: context || undefined
    };
    
    console.log('Sending to API:', API_URL + '/generate', payload);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);
    console.log('Response received:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API success:', data);
    
    currentReply = data.reply || 'No reply generated';
    currentRiskAnalysis = data.risk || {};
    
    displayResult(data);
    showResultSection();
  } catch (error) {
    console.error('API call error:', error.message);
    showError(`Failed to generate reply: ${error.message}`);
  }
}

function displayResult(data) {
  console.log('displayResult called with:', data);
  
  // Get the main reply - try different field names
  const reply = data.reply || 
                (data.reply_drafts && data.reply_drafts[0] && data.reply_drafts[0].body) ||
                'No reply generated';
  
  // Main reply
  document.getElementById('mainReply').textContent = reply;
  console.log('Set main reply to:', reply);

  // Risk badge
  const riskBadge = document.getElementById('riskBadge');
  const riskLevel = data.risk?.severity || 'low';
  riskBadge.className = `risk-badge ${riskLevel}`;
  riskBadge.textContent = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1);

  // Risk flags
  const riskFlags = document.getElementById('riskFlags');
  riskFlags.innerHTML = '';
  if (data.risk?.flags && Array.isArray(data.risk.flags)) {
    data.risk.flags.forEach(flag => {
      const span = document.createElement('span');
      span.className = 'risk-flag';
      span.textContent = flag;
      riskFlags.appendChild(span);
    });
  }

  // Risk notes
  const riskNotes = data.risk?.notes || [];
  const notesText = Array.isArray(riskNotes) ? riskNotes.join(' ') : riskNotes;
  document.getElementById('riskNotes').textContent = notesText || 'No issues detected';

  // Alternatives - use reply_drafts if available
  const alternativesList = document.getElementById('alternativesList');
  alternativesList.innerHTML = '';
  const alternatives = data.alternatives || 
                       (data.reply_drafts && data.reply_drafts.map(d => d.body)) || 
                       [];
  
  if (alternatives && alternatives.length > 0) {
    alternatives.forEach((alt, index) => {
      if (alt) {
        const div = document.createElement('div');
        div.className = 'alternative-item';
        div.textContent = alt;
        div.addEventListener('click', () => {
          currentReply = alt;
          document.getElementById('mainReply').textContent = alt;
        });
        alternativesList.appendChild(div);
      }
    });
  }
  
  console.log('displayResult finished');
}

function copyReply() {
  if (currentReply) {
    navigator.clipboard.writeText(currentReply).then(() => {
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy';
      }, 2000);
    });
  }
}

function showShareSection() {
  document.getElementById('shareEmail').value = '';
  document.getElementById('shareMessage').value = '';
  hideAllSections();
  shareSection.classList.add('active');
  shareSection.style.display = 'block';
}

function showEditSection() {
  document.getElementById('editText').value = currentReply;
  hideAllSections();
  editSection.classList.add('active');
  editSection.style.display = 'block';
}

function showFormSection() {
  hideAllSections();
  formSection.style.display = 'block';
}

function showResultSection() {
  hideAllSections();
  resultSection.classList.add('active');
  resultSection.style.display = 'block';
}

function showLoadingSection() {
  hideAllSections();
  loadingSection.classList.add('active');
  loadingSection.style.display = 'block';
}

function showError(message) {
  document.getElementById('errorMessage').textContent = message;
  hideAllSections();
  errorSection.classList.add('active');
  errorSection.style.display = 'block';
}

function hideAllSections() {
  formSection.style.display = 'none';
  loadingSection.style.display = 'none';
  resultSection.style.display = 'none';
  shareSection.style.display = 'none';
  editSection.style.display = 'none';
  errorSection.style.display = 'none';
}

function sendForReview() {
  const email = document.getElementById('shareEmail').value;
  const message = document.getElementById('shareMessage').value;

  if (!email) {
    alert('Please enter an email address');
    return;
  }

  // TODO: Implement backend sharing functionality
  alert(`Draft shared with ${email}`);
  showResultSection();
}

function saveEdit() {
  currentReply = document.getElementById('editText').value;
  document.getElementById('mainReply').textContent = currentReply;
  showResultSection();
}

// Load saved draft on popup open
window.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['lastEmail', 'lastContext'], (result) => {
    if (result.lastEmail) {
      emailTextArea.value = result.lastEmail;
    }
    if (result.lastContext) {
      contextArea.value = result.lastContext;
    }
  });

  // Save draft on input
  emailTextArea.addEventListener('change', () => {
    chrome.storage.local.set({ lastEmail: emailTextArea.value });
  });

  contextArea.addEventListener('change', () => {
    chrome.storage.local.set({ lastContext: contextArea.value });
  });
});
