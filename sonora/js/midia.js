let currentUserData = null;
let currentEventId = null;
let currentCategory = 'interactive';
let currentFolderId = null;

async function init() {
    try {
        currentUserData = await apiRequest('/users/me/');
        
        const myEvents = currentUserData.my_events || [];
        const selector = document.getElementById('event-selector');
        selector.innerHTML = '';

        if (myEvents.length === 0) {
            selector.innerHTML = '<option value="">Nenhum evento</option>';
            document.getElementById('lista').innerHTML = "Você não possui eventos vinculados.";
            return;
        }

        myEvents.forEach(ev => {
            const opt = document.createElement('option');
            opt.value = ev.event_id;
            opt.innerText = ev.event_name;
            selector.appendChild(opt);
        });

        currentEventId = myEvents[0].event_id;
        render();
    } catch (err) {
        console.error("Erro na inicialização:", err);
    }
}

function switchEvent() {
    currentEventId = document.getElementById('event-selector').value;
    currentFolderId = null;
    render();
}

function switchTab(category) {
    currentCategory = category;
    document.getElementById('tab-interactive').classList.toggle('active', category === 'interactive');
    document.getElementById('tab-background').classList.toggle('active', category === 'background');
    render();
}

function render() {
    const event = currentUserData.my_events.find(e => e.event_id === currentEventId);
    if (!event) return;

    // Render Folders
    renderFolders(event.folders);

    // Filter Musics
    const filteredMusics = event.musics.filter(m => 
        m.category === currentCategory && 
        (currentFolderId ? m.folder === currentFolderId : !m.folder)
    );

    const lista = document.getElementById('lista');
    lista.innerHTML = "";

    if (filteredMusics.length === 0) {
        lista.innerHTML = `<p style="padding: 20px;">Nenhuma música nesta ${currentFolderId ? 'pasta' : 'aba'}.</p>`;
        return;
    }

    filteredMusics.forEach(m => {
        const item = document.createElement('div');
        item.className = 'card musica-item';
        
        const statusIcon = m.status === 'accepted' ? '✅' : (m.status === 'rejected' ? '❌' : '⏳');
        
        item.innerHTML = `
            <div>
                <div class="titulo">${m.order}. ${m.name.toUpperCase()} - ${m.singer} ${statusIcon}</div>
                <div class="obs">${m.url || 'Arquivo local'} | Status: ${m.status}</div>
            </div>
            <div class="musica-actions">
                <button class="btn-small btn-edit" onclick="openEditModal('${m.id}')">Editar</button>
                <button class="btn-small btn-delete" onclick="deleteMusic('${m.id}')">Excluir</button>
            </div>
        `;
        lista.appendChild(item);
    });
}

function renderFolders(folders) {
    const list = document.getElementById('folder-list');
    list.innerHTML = `<div class="folder-item ${!currentFolderId ? 'active' : ''}" onclick="selectFolder(null)">📁 Raiz (Ver todas sem pasta)</div>`;
    
    folders.forEach(f => {
        const item = document.createElement('div');
        item.className = `folder-item ${currentFolderId === f.id ? 'active' : ''}`;
        item.style.paddingLeft = f.parent ? '20px' : '0';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        
        item.innerHTML = `
            <span onclick="selectFolder('${f.id}')" style="flex:1">📂 ${f.name}</span>
            <div class="musica-actions">
                <button class="btn-small btn-edit" onclick="showFolderModal('${f.id}', '${f.name}', '${f.parent || ''}')">✎</button>
                <button class="btn-small btn-delete" onclick="deleteFolder('${f.id}')">×</button>
            </div>
        `;
        list.appendChild(item);
    });
}

async function deleteFolder(id) {
    if (!confirm("Excluir esta pasta? As músicas ficarão sem pasta.")) return;
    try {
        await apiRequest(`/folders/${id}/`, 'DELETE');
        await init();
    } catch (err) {
        alert("Erro ao excluir pasta: " + err.message);
    }
}

function selectFolder(id) {
    currentFolderId = id;
    render();
}

// Modal Logic
function openEditModal(musicOrderId) {
    const event = currentUserData.my_events.find(e => e.event_id === currentEventId);
    const m = event.musics.find(mo => mo.id === musicOrderId);
    
    document.getElementById('edit-id').value = m.id;
    document.getElementById('edit-name').value = m.name;
    document.getElementById('edit-singer').value = m.singer;
    document.getElementById('edit-order').value = m.order;
    document.getElementById('edit-category').value = m.category;
    document.getElementById('edit-status').value = m.status;
    
    // Fill folders in select
    const folderSelect = document.getElementById('edit-folder');
    folderSelect.innerHTML = '<option value="">Sem Pasta</option>';
    event.folders.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.innerText = f.name;
        if (f.id === m.folder) opt.selected = true;
        folderSelect.appendChild(opt);
    });

    document.getElementById('edit-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

async function saveEdit() {
    const id = document.getElementById('edit-id').value;
    const data = {
        order: document.getElementById('edit-order').value,
        category: document.getElementById('edit-category').value,
        status: document.getElementById('edit-status').value,
        folder: document.getElementById('edit-folder').value || null
    };

    try {
        await apiRequest(`/music-order/${id}/`, 'PATCH', data);
        await init(); // Refresh all data
        closeModal();
    } catch (err) {
        alert("Erro ao salvar: " + err.message);
    }
}

async function deleteMusic(id) {
    if (!confirm("Deseja realmente excluir esta música do evento?")) return;
    try {
        await apiRequest(`/music-order/${id}/`, 'DELETE');
        await init();
    } catch (err) {
        alert("Erro ao excluir: " + err.message);
    }
}

// Folders Modal
function showFolderModal(id = null, name = '', parentId = '') {
    const event = currentUserData.my_events.find(e => e.event_id === currentEventId);
    document.getElementById('folder-name').value = name;
    document.getElementById('edit-folder-id').value = id || '';
    
    const parentSelect = document.getElementById('folder-parent');
    parentSelect.innerHTML = '<option value="">Raiz</option>';
    event.folders.forEach(f => {
        if (f.id === id) return; // Don't allow self as parent
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.innerText = f.name;
        if (f.id === parentId) opt.selected = true;
        parentSelect.appendChild(opt);
    });
    
    document.getElementById('folder-modal-title').innerText = id ? 'Editar Pasta' : 'Nova Pasta';
    document.getElementById('folder-save-btn').innerText = id ? 'Salvar Alterações' : 'Criar';
    document.getElementById('folder-modal').style.display = 'flex';
}

function closeFolderModal() {
    document.getElementById('folder-modal').style.display = 'none';
}

async function saveFolder() {
    const id = document.getElementById('edit-folder-id').value;
    const name = document.getElementById('folder-name').value;
    const parent = document.getElementById('folder-parent').value || null;
    
    try {
        if (id) {
            await apiRequest(`/folders/${id}/`, 'PATCH', { name, parent });
        } else {
            await apiRequest('/folders/', 'POST', { name, parent, event: currentEventId });
        }
        await init();
        closeFolderModal();
    } catch (err) {
        alert("Erro ao salvar pasta: " + err.message);
    }
}

init();
