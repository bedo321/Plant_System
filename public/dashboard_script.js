document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        window.location.href = '/index.html';
        return;
    }
    document.getElementById('welcome-message').textContent = `Welcome, ${loggedInUser}!`;

    let plantData = [];
    let state = {
        view: 'plants', 
        masterSearchTerm: '',
        detailSearchTerm: '',
        selectedPlantId: null,
        selectedLineId: null,
        selectedMachineId: null,
    };
    
    const masterTitle = document.getElementById('master-title');
    const detailTitle = document.getElementById('detail-title');
    const masterList = document.getElementById('master-list');
    const detailList = document.getElementById('detail-list');
    const backBtn = document.getElementById('back-btn');
    const addItemForm = document.getElementById('add-item-form');
    const newItemInput = document.getElementById('new-item-name');
    const addItemBtn = document.getElementById('add-item-btn');
    const addMachineForm = document.getElementById('add-machine-form');
    const newMachineNameInput = document.getElementById('new-machine-name');
    const masterActionPanel = document.getElementById('master-action-panel');
    const detailActionPanel = document.getElementById('detail-action-panel');
    const editMasterBtn = document.getElementById('edit-master-btn');
    const deleteMasterBtn = document.getElementById('delete-master-btn');
    const editDetailBtn = document.getElementById('edit-detail-btn');
    const deleteDetailBtn = document.getElementById('delete-detail-btn');
    const masterSearchInput = document.getElementById('master-search-input');
    const detailSearchInput = document.getElementById('detail-search-input');
    const saveChangesBtn = document.getElementById('save-changes-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalInput = document.getElementById('modal-input');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');

    const loadData = async () => {
        try {
            const response = await fetch('/api/plants');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            plantData = data.plantstructure.plant;
            updateUI();
        } catch (error) {
            console.error("Failed to load plant data:", error);
            alert("Error: Could not load data from server.");
        }
    };
    const saveData = async () => {
        try {
            const response = await fetch('/api/plants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plantstructure: { plant: plantData } })
            });
            const result = await response.json();
            alert(result.message);
        } catch (error) {
            console.error('Failed to save data:', error);
            alert('Error: Could not save changes.');
        }
    };

    const showModal = (config) => {
        return new Promise((resolve, reject) => {
            modalTitle.textContent = config.title;
            modalMessage.textContent = config.message;
            modalConfirmBtn.textContent = config.confirmText || 'Confirm';
            modalConfirmBtn.className = `btn ${config.confirmClass || 'btn-primary'}`;


            if (config.showInput) {
                modalInput.style.display = 'block';
                modalInput.value = config.defaultValue || '';
            } else {
                modalInput.style.display = 'none';
            }
            
            modalOverlay.style.display = 'flex';
            if(config.showInput) modalInput.focus();


            const onConfirm = () => {
                cleanup();
                resolve(config.showInput ? modalInput.value : true);
            };

            const onCancel = () => {
                cleanup();
                reject();
            };
            
            const cleanup = () => {
                modalOverlay.style.display = 'none';
                modalConfirmBtn.removeEventListener('click', onConfirm);
                modalCancelBtn.removeEventListener('click', onCancel);
            };

            modalConfirmBtn.addEventListener('click', onConfirm);
            modalCancelBtn.addEventListener('click', onCancel);
        });
    };

    const updateUI = () => {
        masterList.innerHTML = '';
        detailList.innerHTML = '';
        masterActionPanel.style.display = 'none';
        detailActionPanel.style.display = 'none';
        addMachineForm.style.display = 'none';
        detailSearchInput.style.display = 'none';

        if (state.view === 'plants') {
            masterTitle.textContent = 'Plants';
            masterSearchInput.placeholder = 'Search plants...';
            detailTitle.textContent = 'Select a plant to see its lines';
            backBtn.style.display = 'none';
            newItemInput.placeholder = 'Add a new plant...';
            addItemBtn.textContent = 'Add Plant';

            const filteredPlants = plantData.filter(p => p.name.toLowerCase().includes(state.masterSearchTerm));
            filteredPlants.forEach(plant => {
                const item = createListItem(plant, 'plant', state.selectedPlantId === plant.id);
                masterList.appendChild(item);
            });

            const selectedPlant = plantData.find(p => p.id === state.selectedPlantId);
            if (selectedPlant) {
                masterActionPanel.style.display = 'flex';
                detailTitle.textContent = `Lines in ${selectedPlant.name}`;
                detailSearchInput.style.display = 'block';
                detailSearchInput.placeholder = 'Search lines...';
                
                const filteredLines = selectedPlant.line.filter(l => l.name.toLowerCase().includes(state.detailSearchTerm));
                filteredLines.forEach(line => {
                    const detailItem = createListItem(line, 'line-detail', state.selectedLineId === line.id);
                    detailList.appendChild(detailItem);
                });

                if (state.selectedLineId) {
                    detailActionPanel.style.display = 'flex';
                }
            }

        } else if (state.view === 'lines') {
            const selectedPlant = plantData.find(p => p.id === state.selectedPlantId);
            masterTitle.textContent = `Lines in ${selectedPlant.name}`;
            masterSearchInput.placeholder = 'Search lines...';
            backBtn.style.display = 'block';
            newItemInput.placeholder = 'Add a new line...';
            addItemBtn.textContent = 'Add Line';

            const filteredLines = selectedPlant.line.filter(l => l.name.toLowerCase().includes(state.masterSearchTerm));
            filteredLines.forEach(line => {
                const item = createListItem(line, 'line', state.selectedLineId === line.id);
                masterList.appendChild(item);
            });

            const selectedLine = selectedPlant.line.find(l => l.id === state.selectedLineId);
            if (selectedLine) {
                masterActionPanel.style.display = 'flex';
                addMachineForm.style.display = 'flex';
                detailTitle.textContent = `Machines in ${selectedLine.name}`;
                detailSearchInput.style.display = 'block';
                detailSearchInput.placeholder = 'Search machines...';

                const filteredMachines = selectedLine.machine.filter(m => m.name.toLowerCase().includes(state.detailSearchTerm));
                filteredMachines.forEach(machine => {
                    const detailItem = createListItem(machine, 'machine', state.selectedMachineId === machine.id);
                    detailList.appendChild(detailItem);
                });
                
                if (state.selectedMachineId) {
                    detailActionPanel.style.display = 'flex';
                }
            } else {
                detailTitle.textContent = 'Select a line to see its machines';
            }
        }
    };

    async function handleEdit(type) {
        let entity;
        if (type === 'plant') entity = plantData.find(p => p.id === state.selectedPlantId);
        else if (type === 'line') entity = plantData.find(p => p.id === state.selectedPlantId)?.line.find(l => l.id === state.selectedLineId);
        else if (type === 'machine') entity = plantData.find(p => p.id === state.selectedPlantId)?.line.find(l => l.id === state.selectedLineId)?.machine.find(m => m.id === state.selectedMachineId);
        
        if(!entity) return;

        try {
            const newName = await showModal({
                title: `Edit ${type.charAt(0).toUpperCase() + type.slice(1)} Name`,
                message: `Enter a new name for "${entity.name}":`,
                showInput: true,
                defaultValue: entity.name,
                confirmText: 'Save'
            });

            if (newName && newName.trim() !== '') {
                entity.name = newName.trim();
                updateUI();
            }
        } catch (err) {
            console.error('Error editing entity:', err);
        }
    }

    async function handleDelete(type) {
        let id, name;
        if (type === 'plant') { id = state.selectedPlantId; name = plantData.find(p => p.id === id)?.name; }
        else if (type === 'line') { id = state.selectedLineId; name = plantData.find(p => p.id === state.selectedPlantId)?.line.find(l => l.id === id)?.name; }
        else if (type === 'machine') { id = state.selectedMachineId; name = plantData.find(p => p.id === state.selectedPlantId)?.line.find(l => l.id === state.selectedLineId)?.machine.find(m => m.id === id)?.name; }

        if (!id) return;

        try {
            await showModal({
                title: `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
                showInput: false,
                confirmText: 'Delete',
                confirmClass: 'btn-danger'
            });

            if (type === 'plant') {
                plantData = plantData.filter(p => p.id !== id);
                state.selectedPlantId = null;
            } else if (type === 'line') {
                const plant = plantData.find(p => p.id === state.selectedPlantId);
                if(plant) plant.line = plant.line.filter(l => l.id !== id);
                state.selectedLineId = null;
            } else if (type === 'machine') {
                const line = plantData.find(p => p.id === state.selectedPlantId)?.line.find(l => l.id === state.selectedLineId);
                if(line) line.machine = line.machine.filter(m => m.id !== id);
                state.selectedMachineId = null;
            }
            updateUI();
        } catch(err) {
            console.error('Error editing entity:', err);
        }
    }

    editMasterBtn.addEventListener('click', () => handleEdit(state.view === 'plants' ? 'plant' : 'line'));
    deleteMasterBtn.addEventListener('click', () => handleDelete(state.view === 'plants' ? 'plant' : 'line'));
    editDetailBtn.addEventListener('click', () => handleEdit(state.view === 'plants' ? 'line' : 'machine'));
    deleteDetailBtn.addEventListener('click', () => handleDelete(state.view === 'plants' ? 'line' : 'machine'));

    backBtn.addEventListener('click', () => {
        state.view = 'plants';
        state.selectedLineId = null;
        state.selectedMachineId = null;
        state.masterSearchTerm = '';
        state.detailSearchTerm = '';
        masterSearchInput.value = '';
        detailSearchInput.value = '';
        updateUI();
    });

    addItemForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = newItemInput.value.trim();
        if (!name) return;

        if (state.view === 'plants') {
            plantData.push({ id: getNextId(plantData), name, line: [] });
        } else if (state.view === 'lines' && state.selectedPlantId) {
            const plant = plantData.find(p => p.id === state.selectedPlantId);
            plant.line.push({ id: getNextId(plant.line), name, machine: [] });
        }
        newItemInput.value = '';
        updateUI();
    });
    
    addMachineForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = newMachineNameInput.value.trim();
        if(!name || !state.selectedLineId) return;

        const line = plantData.find(p => p.id === state.selectedPlantId)?.line.find(l => l.id === state.selectedLineId);
        if(line){
            line.machine.push({ id: getNextId(line.machine), name });
            newMachineNameInput.value = '';
            updateUI();
        }
    });

    masterSearchInput.addEventListener('input', e => { state.masterSearchTerm = e.target.value.toLowerCase(); updateUI(); });
    detailSearchInput.addEventListener('input', e => { state.detailSearchTerm = e.target.value.toLowerCase(); updateUI(); });
    
    function getNextId(array) {
        if (!array || array.length === 0) return "1";
        const maxId = Math.max(...array.map(item => parseInt(item.id) || 0));
        return (maxId + 1).toString();
    }

    function createListItem(entity, type, isSelected = false) {
        const li = document.createElement('li');
        li.className = 'list-item';
        if (isSelected) li.classList.add('selected');

        const textSpan = document.createElement('span');
        textSpan.textContent = entity.name;
        li.appendChild(textSpan);

        li.addEventListener('click', () => {
            if (type === 'plant') {
                state.selectedPlantId = entity.id;
                state.selectedLineId = null;
                state.selectedMachineId = null;
                state.detailSearchTerm = '';
                detailSearchInput.value = '';
            } else if (type === 'line') {
                state.selectedLineId = entity.id;
                state.selectedMachineId = null;
            } else if (type === 'line-detail') {
                state.view = 'lines';
                state.selectedLineId = entity.id;
                state.selectedMachineId = null;
                state.masterSearchTerm = '';
                masterSearchInput.value = '';
            } else if (type === 'machine') {
                state.selectedMachineId = entity.id;
            }
            updateUI();
        });
        return li;
    };

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = '/index.html';
    });
    saveChangesBtn.addEventListener('click', saveData);
    loadData();
});
