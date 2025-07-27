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
        selectedPlantId: null,
        selectedLineId: null,
    };

    // Element references
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
    const actionPanel = document.getElementById('action-panel');
    const viewDetailsBtn = document.getElementById('view-details-btn');
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    const saveChangesBtn = document.getElementById('save-changes-btn');
    const logoutBtn = document.getElementById('logout-btn');

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

    const updateUI = () => {
        masterList.innerHTML = '';
        detailList.innerHTML = '';
        actionPanel.style.display = 'none';
        addMachineForm.style.display = 'none';

        if (state.view === 'plants') {
            masterTitle.textContent = 'Plants';
            detailTitle.textContent = 'Select a plant to see its lines';
            backBtn.style.display = 'none';
            newItemInput.placeholder = 'Add a new plant...';
            addItemBtn.textContent = 'Add Plant';

            plantData.forEach(plant => {
                const item = createListItem(plant.name, `plant-${plant.id}`, state.selectedPlantId === plant.id);
                item.addEventListener('click', () => {
                    state.selectedPlantId = plant.id;
                    state.selectedLineId = null;
                    updateUI();
                });
                masterList.appendChild(item);
            });

            const selectedPlant = plantData.find(p => p.id === state.selectedPlantId);
            if (selectedPlant) {
                actionPanel.style.display = 'flex';
                viewDetailsBtn.textContent = 'View / Manage Lines';
                viewDetailsBtn.style.display = 'block';
                detailTitle.textContent = `Lines in ${selectedPlant.name}`;
                selectedPlant.line.forEach(line => {
                    const detailItem = createListItem(line.name, `line-${line.id}`, false, false);
                    detailList.appendChild(detailItem);
                });
            }

        } else if (state.view === 'lines') {
            const selectedPlant = plantData.find(p => p.id === state.selectedPlantId);
            masterTitle.textContent = `Lines in ${selectedPlant.name}`;
            backBtn.style.display = 'block';
            newItemInput.placeholder = 'Add a new line...';
            addItemBtn.textContent = 'Add Line';

            selectedPlant.line.forEach(line => {
                const item = createListItem(line.name, `line-${line.id}`, state.selectedLineId === line.id);
                item.addEventListener('click', () => {
                    state.selectedLineId = line.id;
                    updateUI();
                });
                masterList.appendChild(item);
            });

            const selectedLine = selectedPlant.line.find(l => l.id === state.selectedLineId);
            if (selectedLine) {
                actionPanel.style.display = 'flex';
                viewDetailsBtn.style.display = 'none'; // No further drill-down
                detailTitle.textContent = `Machines in ${selectedLine.name}`;
                addMachineForm.style.display = 'flex';
                selectedLine.machine.forEach(machine => {
                    const detailItem = createListItem(machine.name, `machine-${machine.id}`);
                    detailList.appendChild(detailItem);
                });
            } else {
                detailTitle.textContent = 'Select a line to see its machines';
            }
        }
    };

    viewDetailsBtn.addEventListener('click', () => {
        if (state.view === 'plants' && state.selectedPlantId) {
            state.view = 'lines';
            updateUI();
        }
    });

    deleteSelectedBtn.addEventListener('click', () => {
        const type = state.view === 'plants' ? 'plant' : 'line';
        const id = type === 'plant' ? state.selectedPlantId : state.selectedLineId;
        if (!id) return;
        
        if (confirm(`Are you sure you want to delete the selected ${type}?`)) {
            if (type === 'plant') {
                plantData = plantData.filter(p => p.id !== id);
                state.selectedPlantId = null;
            } else if (type === 'line') {
                const plant = plantData.find(p => p.id === state.selectedPlantId);
                plant.line = plant.line.filter(l => l.id !== id);
                state.selectedLineId = null;
            }
            updateUI();
        }
    });

    backBtn.addEventListener('click', () => {
        state.view = 'plants';
        state.selectedLineId = null;
        updateUI();
    });

    addItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = newItemInput.value.trim();
        if (!name) return;

        if (state.view === 'plants') {
            plantData.push({ id: Date.now().toString(), name, line: [] });
        } else if (state.view === 'lines' && state.selectedPlantId) {
            const plant = plantData.find(p => p.id === state.selectedPlantId);
            plant.line.push({ id: Date.now().toString(), name, machine: [] });
        }
        newItemInput.value = '';
        updateUI();
    });
    
    addMachineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = newMachineNameInput.value.trim();
        if(!name || !state.selectedLineId) return;

        const plant = plantData.find(p => p.id === state.selectedPlantId);
        const line = plant?.line.find(l => l.id === state.selectedLineId);
        if(line){
            line.machine.push({ id: Date.now().toString(), name });
            newMachineNameInput.value = '';
            updateUI();
        }
    });

    const handleMachineRemove = (fullId) => {
        const [type, id] = fullId.split('-');
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

        const plant = plantData.find(p => p.id === state.selectedPlantId);
        const line = plant?.line.find(l => l.id === state.selectedLineId);
        if(line) {
            line.machine = line.machine.filter(m => m.id !== id);
            updateUI();
        }
    };

    const createListItem = (name, fullId, isSelected = false) => {
        const li = document.createElement('li');
        li.className = 'list-item';
        if (isSelected) li.classList.add('selected');
        
        const textSpan = document.createElement('span');
        textSpan.textContent = name;
        li.appendChild(textSpan);

        if (fullId.startsWith('machine')) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                handleMachineRemove(fullId);
            };
            li.appendChild(removeBtn);
        }
        return li;
    };

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = '/index.html';
    });
    saveChangesBtn.addEventListener('click', saveData);
    loadData();
});
