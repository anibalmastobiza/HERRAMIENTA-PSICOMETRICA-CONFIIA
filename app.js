/* ========================================
   CONFIIA Survey - Application Logic
   ======================================== */

// ============================================
// CONFIGURATION
// ============================================

// IMPORTANT: Replace this URL with your Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzj7B8zD0p2YHHbHpijRa2TqFrJ0bXaa8SyTLoI3eM4KQxuq-h-2E0IfydVUcESw-_i/exec';

// Items bank - Professional version
const ITEMS_PROFESSIONAL = [
    {
        id: 'P1',
        dimension: 'Precisión diagnóstica',
        text: '¿Confiaría en un diagnóstico de alta precisión generado por IA para resolver un cuadro clínico de síntomas inespecíficos que ha resultado inconcluso para los especialistas humanos?',
        reverse: false
    },
    {
        id: 'P2',
        dimension: 'Explicabilidad del sistema',
        text: '¿Validaría una recomendación clínica generada por IA que no ofrece una explicación causal clara (caja negra), aunque sus datos estadísticos indiquen una alta fiabilidad científica?',
        reverse: true // "Sí" indica alta confianza ciega (riesgo), "No" indica cautela epistémica.
    },
    {
        id: 'P3',
        dimension: 'Consenso experto',
        text: '¿Implementaría una pauta personalizada generada por IA para un caso complejo, si su equipo clínico está convencido?',
        reverse: false
    },
    {
        id: 'P4',
        dimension: 'Consenso experto (inverso)',
        text: '¿Implementaría una pauta personalizada generada por IA para un caso complejo, si su equipo clínico es escéptico?',
        reverse: true
    },
    {
        id: 'P5',
        dimension: 'Supervisión humana',
        text: '¿Autorizaría que un sistema autónomo (como un robot o algoritmo) ajuste dosis de medicación en pacientes basándose en variables ambientales y clínicas, sin requerir su validación manual previa?',
        reverse: true
    },
    {
        id: 'P6',
        dimension: 'Enfoque de tratamiento y estrategia',
        text: '¿Prescribiría una intervención innovadora basada en análisis genómicos de IA si esta se desvía de los protocolos clínicos estándar aprobados actualmente?',
        reverse: false
    },
    {
        id: 'P7',
        dimension: 'Momento/intensidad de la intervención',
        text: '¿Indicaría un tratamiento invasivo y agresivo recomendado por la IA en un paciente asintomático, basándose exclusivamente en una detección algorítmica de riesgo futuro?',
        reverse: true
    },
    {
        id: 'P8',
        dimension: 'Contexto de pronóstico/complejidad',
        text: '¿Se basaría en la predicción de un algoritmo de IA para determinar la limitación del esfuerzo terapéutico (paliativos) en una enfermedad rara con pronóstico vital incierto?',
        reverse: false
    }
];

// Items bank - Citizen version
const ITEMS_CITIZEN = [
    {
        id: 'C1',
        dimension: 'Precisión diagnóstica',
        text: '¿Confiaría en un diagnóstico realizado por una IA que identifica su enfermedad con alta precisión cuando sus médicos no han logrado encontrar una respuesta clara a sus síntomas?',
        reverse: false
    },
    {
        id: 'C2',
        dimension: 'Explicabilidad del sistema',
        text: '¿Aceptaría un tratamiento propuesto por una IA si su médico no puede explicarle con claridad por qué la máquina lo ha elegido (caja negra)?',
        reverse: true
    },
    {
        id: 'C3',
        dimension: 'Consenso de equipo',
        text: '¿Mantendría su confianza en una intervención (ej. cirugía) recomendada por la IA si su equipo médico expresa dudas o reservas sobre dicha recomendación?',
        reverse: true
    },
    {
        id: 'C4',
        dimension: 'Supervisión humana',
        text: '¿Se sentiría seguro/a utilizando un dispositivo de IA que monitoriza y ajusta automáticamente su medicación diaria sin que el médico revise cada cambio?',
        reverse: false
    },
    {
        id: 'C5',
        dimension: 'Enfoque de tratamiento y estrategia',
        text: '¿Estaría dispuesto/a a recibir un tratamiento experimental personalizado recomendado por una IA que es diferente a los tratamientos tradicionales habituales?',
        reverse: false
    },
    {
        id: 'C6',
        dimension: 'Momento/intensidad de la intervención',
        text: '¿Aceptaría someterse a un tratamiento agresivo preventivo si una IA lo recomienda al detectar una enfermedad rara, aunque usted se sienta perfectamente sano/a?',
        reverse: true
    },
    {
        id: 'C7',
        dimension: 'Contexto de pronóstico/complejidad',
        text: '¿Aceptaría la recomendación de una IA de pasar a cuidados paliativos (solo control de síntomas) si la máquina predice que su enfermedad ya no tiene cura posible?',
        reverse: false
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
        if (GOOGLE_SCRIPT_URL !== 'https://script.google.com/macros/s/AKfycbzj7B8zD0p2YHHbHpijRa2TqFrJ0bXaa8SyTLoI3eM4KQxuq-h-2E0IfydVUcESw-_i/exec') {
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
