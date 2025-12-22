/* ========================================
   CONFIIA Survey - Application Logic
   ======================================== */

// ============================================
// CONFIGURATION
// ============================================

// IMPORTANT: Replace this URL with your Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJEY-s_3onfo57Gp4mS43V5tEFS6kIyxPRWKfqvYJmZO7SXaBtw5kXXuc4jZUZkAxgtg/exec';

// Items bank - Professional version
const ITEMS_PROFESSIONAL = [
    {
        id: 'P1',
        dimension: 'Innovación-tradición',
        text: '¿Seguiría una recomendación innovadora de la IA frente a una tradicional si ambas son clínicamente plausibles?',
        reverse: true
    },
    {
        id: 'P2',
        dimension: 'Explicabilidad-riesgo',
        text: '¿Aprobaría una recomendación agresiva de la IA si su justificación no es explicable con claridad clínica?',
        reverse: true
    },
    {
        id: 'P3',
        dimension: 'Consenso experto',
        text: '¿Implementaría una pauta personalizada generada por IA para un caso complejo, si el equipo clínico está convencido?',
        reverse: false
    },
    {
        id: 'P4',
        dimension: 'Consenso experto (inverso)',
        text: '¿Implementaría la misma pauta si el equipo clínico se muestra escéptico?',
        reverse: true
    },
    {
        id: 'P5',
        dimension: 'Supervisión humana',
        text: '¿Delegaría una decisión clínica crítica en una IA supervisada por humanos?',
        reverse: false
    },
    {
        id: 'P6',
        dimension: 'Autonomía plena',
        text: '¿Delegaría una decisión clínica crítica en una IA sin supervisión humana?',
        reverse: true
    }
];

// Items bank - Citizen version
const ITEMS_CITIZEN = [
    {
        id: 'C1',
        dimension: 'Explicabilidad-riesgo',
        text: '¿Aceptaría un plan de tratamiento agresivo propuesto por la IA si no puede ser explicado con claridad por su médico?',
        reverse: true
    },
    {
        id: 'C2',
        dimension: 'Innovación-tradición',
        text: '¿Preferiría una recomendación tradicional frente a una innovadora de IA para su tratamiento?',
        reverse: false
    },
    {
        id: 'C3',
        dimension: 'Consenso experto',
        text: '¿Se sentiría cómodo/a si el equipo clínico está convencido y respalda una decisión guiada por IA?',
        reverse: false
    },
    {
        id: 'C4',
        dimension: 'Supervisión humana',
        text: '¿Confiaría en una IA supervisada por humanos para decidir su pauta de tratamiento?',
        reverse: false
    },
    {
        id: 'C5',
        dimension: 'Autonomía plena',
        text: '¿Confiaría en una IA no supervisada para decidir su pauta de tratamiento?',
        reverse: true
    },
    {
        id: 'C6',
        dimension: 'Autonomía comunicativa',
        text: '¿Utilizaría un chatbot de IA para recibir un diagnóstico sin ver antes a un médico?',
        reverse: true
    }
];

// ============================================
// STATE MANAGEMENT
// ============================================

const state = {
    currentScreen: 0,
    currentItem: 0,
    participantId: null,
    startTime: null,
    role: null,
    items: [],
    responses: {
        consent: false,
        demographics: {},
        items: {}
    }
};

const screens = [
    'screen-welcome',
    'screen-consent',
    'screen-demographics',
    'screen-instructions',
    'screen-items',
    'screen-end'
];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    state.participantId = generateParticipantId();
    state.startTime = new Date().toISOString();
    initializeScreens();
});

function generateParticipantId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `CONFIIA-${timestamp}-${randomPart}`.toUpperCase();
}

function initializeScreens() {
    screens.forEach((screenId, index) => {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.toggle('active', index === 0);
        }
    });
}

// ============================================
// NAVIGATION
// ============================================

function nextScreen() {
    if (state.currentScreen < screens.length - 1) {
        const currentScreenEl = document.getElementById(screens[state.currentScreen]);
        state.currentScreen++;
        const nextScreenEl = document.getElementById(screens[state.currentScreen]);
        
        currentScreenEl.classList.remove('active');
        nextScreenEl.classList.add('active');
        
        if (screens[state.currentScreen] === 'screen-items') {
            initializeItems();
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function prevScreen() {
    if (state.currentScreen > 0) {
        const currentScreenEl = document.getElementById(screens[state.currentScreen]);
        state.currentScreen--;
        const nextScreenEl = document.getElementById(screens[state.currentScreen]);
        
        currentScreenEl.classList.remove('active');
        nextScreenEl.classList.add('active');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ============================================
// CONSENT VALIDATION
// ============================================

function validateConsent() {
    const checkbox = document.getElementById('consent-check');
    const nextBtn = document.getElementById('btn-consent-next');
    
    state.responses.consent = checkbox.checked;
    nextBtn.disabled = !checkbox.checked;
}

// ============================================
// ROLE SELECTION
// ============================================

function updateRole() {
    const professionalRadio = document.getElementById('role-professional');
    const citizenRadio = document.getElementById('role-citizen');
    const professionalFields = document.querySelectorAll('.professional-only');
    
    if (professionalRadio.checked) {
        state.role = 'profesional';
        state.items = ITEMS_PROFESSIONAL;
        professionalFields.forEach(field => field.classList.remove('hidden'));
    } else if (citizenRadio.checked) {
        state.role = 'ciudadano';
        state.items = ITEMS_CITIZEN;
        professionalFields.forEach(field => field.classList.add('hidden'));
    }
}

// ============================================
// DEMOGRAPHICS VALIDATION
// ============================================

function validateDemographics() {
    const form = document.getElementById('demographics-form');
    const formData = new FormData(form);
    
    const role = formData.get('role');
    const age = formData.get('age');
    const sex = formData.get('sex');
    const aiFamiliarity = formData.get('ai_familiarity');
    const aiClinicalUse = formData.get('ai_clinical_use');
    
    let isValid = true;
    let errorMessages = [];
    
    if (!role) {
        isValid = false;
        errorMessages.push('Por favor, seleccione su perfil');
    }
    
    if (!age || age < 18) {
        isValid = false;
        errorMessages.push('Por favor, indique su edad (mínimo 18 años)');
    }
    
    if (!sex) {
        isValid = false;
        errorMessages.push('Por favor, seleccione su sexo');
    }
    
    if (!aiFamiliarity) {
        isValid = false;
        errorMessages.push('Por favor, indique su familiaridad con IA');
    }
    
    if (!aiClinicalUse) {
        isValid = false;
        errorMessages.push('Por favor, indique si ha usado IA en contextos clínicos');
    }
    
    if (role === 'profesional') {
        const profession = formData.get('profession');
        const experience = formData.get('experience');
        
        if (!profession) {
            isValid = false;
            errorMessages.push('Por favor, seleccione su profesión');
        }
        
        if (!experience && experience !== 0) {
            isValid = false;
            errorMessages.push('Por favor, indique sus años de experiencia');
        }
    }
    
    if (!isValid) {
        alert(errorMessages.join('\n'));
        return;
    }
    
    state.responses.demographics = {
        role: role,
        age: parseInt(age),
        sex: sex,
        profession: role === 'profesional' ? formData.get('profession') : 'N/A',
        experience: role === 'profesional' ? parseInt(formData.get('experience')) : 'N/A',
        ai_familiarity: parseInt(aiFamiliarity),
        ai_clinical_use: aiClinicalUse
    };
    
    nextScreen();
}

// ============================================
// ITEMS MANAGEMENT
// ============================================

function initializeItems() {
    const container = document.getElementById('items-container');
    container.innerHTML = '';
    
    state.items.forEach((item, index) => {
        const itemHtml = createItemCard(item, index);
        container.innerHTML += itemHtml;
    });
    
    showItem(0);
    updateProgress();
}

function createItemCard(item, index) {
    return `
        <div class="item-card" id="item-${index}" data-item-id="${item.id}">
            <div class="item-number">
                Pregunta ${index + 1} de ${state.items.length}
                <span class="item-dimension">${item.dimension}</span>
            </div>
            <p class="item-question">${item.text}</p>
            <div class="item-scale">
                <div class="likert-options">
                    ${[1, 2, 3, 4].map(value => `
                        <label class="likert-option">
                            <input type="radio" 
                                   name="item-${item.id}" 
                                   value="${value}" 
                                   onchange="handleItemResponse('${item.id}', ${value}, ${index})">
                            <span class="likert-circle">${value}</span>
                        </label>
                    `).join('')}
                </div>
                <div class="item-scale-labels">
                    <span>Muy improbable</span>
                    <span>Muy probable</span>
                </div>
            </div>
        </div>
    `;
}

function showItem(index) {
    const items = document.querySelectorAll('.item-card');
    items.forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
    
    state.currentItem = index;
    
    const prevBtn = document.getElementById('btn-prev-item');
    const nextBtn = document.getElementById('btn-next-item');
    
    prevBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
    
    const currentItemId = state.items[index].id;
    const isAnswered = state.responses.items[currentItemId] !== undefined;
    nextBtn.disabled = !isAnswered;
    
    if (index === state.items.length - 1) {
        nextBtn.innerHTML = `
            Finalizar
            <svg class="icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12,5 19,12 12,19"/>
            </svg>
        `;
    } else {
        nextBtn.innerHTML = `
            Siguiente
            <svg class="icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12,5 19,12 12,19"/>
            </svg>
        `;
    }
    
    updateProgress();
}

function handleItemResponse(itemId, value, index) {
    state.responses.items[itemId] = value;
    document.getElementById('btn-next-item').disabled = false;
}

function nextItem() {
    if (state.currentItem < state.items.length - 1) {
        showItem(state.currentItem + 1);
    } else {
        submitData();
    }
}

function prevItem() {
    if (state.currentItem > 0) {
        showItem(state.currentItem - 1);
    }
}

function updateProgress() {
    const progress = ((state.currentItem + 1) / state.items.length) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = 
        `Pregunta ${state.currentItem + 1} de ${state.items.length}`;
}

// ============================================
// DATA SUBMISSION
// ============================================

async function submitData() {
    const endTime = new Date().toISOString();
    
    const payload = {
        participant_id: state.participantId,
        start_time: state.startTime,
        end_time: endTime,
        role: state.responses.demographics.role,
        age: state.responses.demographics.age,
        sex: state.responses.demographics.sex,
        profession: state.responses.demographics.profession,
        experience: state.responses.demographics.experience,
        ai_familiarity: state.responses.demographics.ai_familiarity,
        ai_clinical_use: state.responses.demographics.ai_clinical_use,
        ...state.responses.items
    };
    
    const nextBtn = document.getElementById('btn-next-item');
    nextBtn.classList.add('loading');
    nextBtn.disabled = true;
    
    try {
        if (GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
        } else {
            console.log('Survey data (demo mode):', payload);
        }
        
       
        nextScreen();
        
    } catch (error) {
        console.error('Error submitting data:', error);
        alert('Ha ocurrido un error al enviar los datos. Por favor, inténtelo de nuevo.');
        nextBtn.classList.remove('loading');
        nextBtn.disabled = false;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

window.addEventListener('beforeunload', (e) => {
    if (state.currentScreen > 0 && state.currentScreen < screens.length - 1) {
        e.preventDefault();
        e.returnValue = '';
    }
});

document.addEventListener('keydown', (e) => {
    if (screens[state.currentScreen] !== 'screen-items') return;
    
    const key = e.key;
    
    if (['1', '2', '3', '4'].includes(key)) {
        const value = parseInt(key);
        const currentItemId = state.items[state.currentItem].id;
        const radio = document.querySelector(`input[name="item-${currentItemId}"][value="${value}"]`);
        if (radio) {
            radio.checked = true;
            handleItemResponse(currentItemId, value, state.currentItem);
        }
    }
    
    if (e.key === 'ArrowRight' || e.key === 'Enter') {
        const nextBtn = document.getElementById('btn-next-item');
        if (!nextBtn.disabled) {
            nextItem();
        }
    }
    
    if (e.key === 'ArrowLeft') {
        prevItem();
    }
});
