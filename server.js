const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'data/users.json');
const PLANTS_FILE = path.join(__dirname, 'data/plants.json');



app.use(express.json());
app.use(express.static('public'));


const readUsers = () => {
    if (!fs.existsSync(USERS_FILE)) {
        return [];
    }
    const data = fs.readFileSync(USERS_FILE);
    return JSON.parse(data);
};
const readPlants = () => {
    if (!fs.existsSync(PLANTS_FILE)) {
        return { plantstructure: { plant: [] } };
    }
    const data = fs.readFileSync(PLANTS_FILE);
    return JSON.parse(data);
};

const writePlants = (data) => {
    fs.writeFileSync(PLANTS_FILE, JSON.stringify(data, null, 2));
};

const writeUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

app.get('/api/plants', (req, res) => {
    const plants = readPlants();
    res.status(200).json(plants);
});

app.post('/api/plants', (req, res) => {
    const newPlantData = req.body;
    
    if (!newPlantData || typeof newPlantData !== 'object') {
        return res.status(400).json({ message: 'Invalid data format.' });
    }
    
    writePlants(newPlantData);
    res.status(200).json({ message: 'Plant data saved successfully!' });
});
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const users = readUsers();

    if (users.some(user => user.username === username)) {
        return res.status(409).json({ message: 'Username already taken.' });
    }

    users.push({ username, password });
    writeUsers(users);

    res.status(201).json({ message: 'Registration successful!' });
});


app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.status(200).json({ message: 'Login successful!', username: user.username });
    } else {
        res.status(401).json({ message: 'Invalid username or password.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});