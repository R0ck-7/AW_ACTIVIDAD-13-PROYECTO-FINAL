// Variables globales
let currentUser = null;
let editingRecipeId = null;

// Funciones de autenticación
function checkLoggedInUser() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        currentUser = user;
        updateUIForLoggedInUser();
    }
    return user;
}

function updateUIForLoggedInUser() {
    const adminLinks = document.querySelectorAll('#admin-link');
    const logoutLinks = document.querySelectorAll('#logout-link');
    const currentUserSpans = document.querySelectorAll('#current-user');
    
    adminLinks.forEach(link => link.classList.remove('hidden'));
    logoutLinks.forEach(link => link.classList.remove('hidden'));
    
    currentUserSpans.forEach(span => {
        if (span) span.textContent = currentUser.username;
    });
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username && u.password === password);
    
    const messageDiv = document.getElementById('login-message');
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Redirigir a la página de administración
        window.location.href = 'admin.html';
    } else {
        messageDiv.textContent = 'Usuario o contraseña incorrectos';
        messageDiv.className = 'message error';
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    const messageDiv = document.getElementById('register-message');
    
    // Validaciones
    if (password !== confirmPassword) {
        messageDiv.textContent = 'Las contraseñas no coinciden';
        messageDiv.className = 'message error';
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (users.find(u => u.username === username)) {
        messageDiv.textContent = 'El nombre de usuario ya existe';
        messageDiv.className = 'message error';
        return;
    }
    
    if (users.find(u => u.email === email)) {
        messageDiv.textContent = 'El correo electrónico ya está registrado';
        messageDiv.className = 'message error';
        return;
    }
    
    // Registrar nuevo usuario
    const newUser = { username, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    messageDiv.textContent = 'Usuario registrado exitosamente. Ahora puedes iniciar sesión.';
    messageDiv.className = 'message success';
    
    document.getElementById('register-form').reset();
    
    // Redirigir a la página de login después de 2 segundos
    setTimeout(() => {
        showLoginSection();
    }, 2000);
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Funciones para gestionar recetas
function loadRecipes() {
    const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    const recipesList = document.getElementById('recipes-list');
    
    if (!recipesList) return;
    
    recipesList.innerHTML = '';
    
    if (recipes.length === 0) {
        recipesList.innerHTML = '<p>No hay recetas disponibles. ¡Sé el primero en agregar una!</p>';
        return;
    }
    
    recipes.forEach(recipe => {
        const recipeCard = createRecipeCard(recipe, false);
        recipesList.appendChild(recipeCard);
    });
}

function loadFeaturedRecipes() {
    const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    const featuredList = document.getElementById('featured-recipes-list');
    
    if (!featuredList) return;
    
    featuredList.innerHTML = '';
    
    // Mostrar las 3 recetas con más votos
    const topRecipes = [...recipes]
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 3);
    
    if (topRecipes.length === 0) {
        featuredList.innerHTML = '<p>No hay recetas destacadas todavía.</p>';
        return;
    }
    
    topRecipes.forEach(recipe => {
        const recipeCard = createRecipeCard(recipe, true);
        featuredList.appendChild(recipeCard);
    });
}

function loadAdminRecipes() {
    if (!currentUser) return;
    
    const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    const adminRecipesList = document.getElementById('admin-recipes-list');
    
    if (!adminRecipesList) return;
    
    adminRecipesList.innerHTML = '';
    
    const userRecipes = recipes.filter(recipe => recipe.author === currentUser.username);
    
    if (userRecipes.length === 0) {
        adminRecipesList.innerHTML = '<p>No has creado ninguna receta todavía.</p>';
        return;
    }
    
    userRecipes.forEach(recipe => {
        const recipeCard = createRecipeCard(recipe, true, true);
        adminRecipesList.appendChild(recipeCard);
    });
}

function createRecipeCard(recipe, isFeatured = false, isAdmin = false) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    
    let imageHtml = '';
    if (recipe.image) {
        imageHtml = `<img src="${recipe.image}" alt="${recipe.name}" class="recipe-image">`;
    }
    
    let adminActions = '';
    if (isAdmin) {
        adminActions = `
            <div class="recipe-actions">
                <button class="btn-secondary" onclick="editRecipe('${recipe.id}')">Editar</button>
                <button class="btn-danger" onclick="deleteRecipe('${recipe.id}')">Eliminar</button>
            </div>
        `;
    }
    
    let voteSection = '';
    if (!isAdmin && !isFeatured) {
        voteSection = `
            <div class="vote-section">
                <button class="vote-btn" onclick="voteRecipe('${recipe.id}', -1)">-</button>
                <span class="vote-count">${recipe.votes}</span>
                <button class="vote-btn" onclick="voteRecipe('${recipe.id}', 1)">+</button>
            </div>
        `;
    }
    
    card.innerHTML = `
        ${imageHtml}
        <h3>${recipe.name}</h3>
        <p><strong>Categoría:</strong> ${getCategoryName(recipe.category)}</p>
        <p><strong>Ingredientes:</strong> ${recipe.ingredients}</p>
        <p><strong>Instrucciones:</strong> ${recipe.instructions}</p>
        <p><strong>Autor:</strong> ${recipe.author}</p>
        ${!isFeatured ? `<p><strong>Votos:</strong> ${recipe.votes}</p>` : ''}
        ${voteSection}
        ${adminActions}
    `;
    
    return card;
}

function getCategoryName(category) {
    const categories = {
        'entrada': 'Entrada',
        'plato-fuerte': 'Plato Fuerte',
        'postre': 'Postre',
        'bebida': 'Bebida'
    };
    
    return categories[category] || category;
}

function handleRecipeSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Debes iniciar sesión para agregar recetas');
        return;
    }
    
    const name = document.getElementById('recipe-name').value;
    const category = document.getElementById('recipe-category').value;
    const ingredients = document.getElementById('recipe-ingredients').value;
    const instructions = document.getElementById('recipe-instructions').value;
    const image = document.getElementById('recipe-image').value;
    
    const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    
    if (editingRecipeId) {
        // Editar receta existente
        const index = recipes.findIndex(r => r.id === editingRecipeId);
        if (index !== -1) {
            recipes[index] = {
                ...recipes[index],
                name,
                category,
                ingredients,
                instructions,
                image: image || recipes[index].image
            };
            
            localStorage.setItem('recipes', JSON.stringify(recipes));
            
            // Mostrar mensaje de éxito
            showMessage('Receta actualizada exitosamente', 'success');
        }
        
        // Limpiar el formulario y salir del modo edición
        cancelEdit();
    } else {
        // Crear nueva receta
        const newRecipe = {
            id: generateId(),
            name,
            category,
            ingredients,
            instructions,
            image,
            author: currentUser.username,
            votes: 0,
            createdAt: new Date().toISOString()
        };
        
        recipes.push(newRecipe);
        localStorage.setItem('recipes', JSON.stringify(recipes));
        
        // Mostrar mensaje de éxito
        showMessage('Receta agregada exitosamente', 'success');
        
        // Limpiar el formulario
        document.getElementById('recipe-form').reset();
    }
    
    // Recargar las recetas en todas las páginas
    loadAdminRecipes();
}

function editRecipe(recipeId) {
    const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    const recipe = recipes.find(r => r.id === recipeId);
    
    if (!recipe) return;
    
    // Llenar el formulario con los datos de la receta
    document.getElementById('recipe-id').value = recipe.id;
    document.getElementById('recipe-name').value = recipe.name;
    document.getElementById('recipe-category').value = recipe.category;
    document.getElementById('recipe-ingredients').value = recipe.ingredients;
    document.getElementById('recipe-instructions').value = recipe.instructions;
    document.getElementById('recipe-image').value = recipe.image || '';
    
    // Cambiar el texto del botón
    document.getElementById('save-recipe-btn').textContent = 'Actualizar Receta';
    
    // Mostrar el botón de cancelar
    document.getElementById('cancel-edit-btn').classList.remove('hidden');
    
    // Guardar el ID de la receta que se está editando
    editingRecipeId = recipeId;
}

function cancelEdit() {
    // Limpiar el formulario
    document.getElementById('recipe-form').reset();
    document.getElementById('recipe-id').value = '';
    
    // Restaurar el texto del botón
    document.getElementById('save-recipe-btn').textContent = 'Guardar Receta';
    
    // Ocultar el botón de cancelar
    document.getElementById('cancel-edit-btn').classList.add('hidden');
    
    // Limpiar el ID de edición
    editingRecipeId = null;
}

function deleteRecipe(recipeId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta receta?')) {
        return;
    }
    
    const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    const updatedRecipes = recipes.filter(r => r.id !== recipeId);
    
    localStorage.setItem('recipes', JSON.stringify(updatedRecipes));
    
    // Recargar las recetas
    loadAdminRecipes();
    
    // Mostrar mensaje de éxito
    showMessage('Receta eliminada exitosamente', 'success');
}

function voteRecipe(recipeId, value) {
    const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    const recipeIndex = recipes.findIndex(r => r.id === recipeId);
    
    if (recipeIndex === -1) return;
    
    // Actualizar los votos
    recipes[recipeIndex].votes += value;
    
    // Guardar en localStorage
    localStorage.setItem('recipes', JSON.stringify(recipes));
    
    // Recargar las recetas
    loadRecipes();
}

function filterRecipes() {
    const category = document.getElementById('category-filter').value;
    const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    const recipesList = document.getElementById('recipes-list');
    
    if (!recipesList) return;
    
    recipesList.innerHTML = '';
    
    let filteredRecipes = recipes;
    
    if (category !== 'all') {
        filteredRecipes = recipes.filter(recipe => recipe.category === category);
    }
    
    if (filteredRecipes.length === 0) {
        recipesList.innerHTML = '<p>No hay recetas en esta categoría.</p>';
        return;
    }
    
    filteredRecipes.forEach(recipe => {
        const recipeCard = createRecipeCard(recipe, false);
        recipesList.appendChild(recipeCard);
    });
}

// Funciones auxiliares
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showMessage(message, type) {
    // Crear un elemento de mensaje temporal
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insertar al principio del contenedor principal
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(messageDiv, container.firstChild);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Funciones para login.html
function showLoginSection() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('register-section').classList.add('hidden');
}

function showRegisterSection() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('register-section').classList.remove('hidden');
}

// Inicializar con algunas recetas de ejemplo si no existen
function initializeSampleData() {
    if (!localStorage.getItem('recipes')) {
        const sampleRecipes = [
            {
                id: generateId(),
                name: 'Tacos al Pastor',
                category: 'plato-fuerte',
                ingredients: 'Carne de cerdo, Piña, Cebolla, Cilantro, Tortillas, Salsa',
                instructions: 'Marinar la carne, cocinar en trompo, servir en tortillas con piña, cebolla y cilantro.',
                author: 'admin',
                votes: 15,
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Guacamole',
                category: 'entrada',
                ingredients: 'Aguacates, Cebolla, Tomate, Limón, Cilantro, Sal',
                instructions: 'Machacar los aguacates, mezclar con los demás ingredientes y servir.',
                author: 'admin',
                votes: 12,
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Churros',
                category: 'postre',
                ingredients: 'Harina, Agua, Azúcar, Canela, Aceite',
                instructions: 'Preparar la masa, freír en aceite caliente y espolvorear con azúcar y canela.',
                author: 'admin',
                votes: 8,
                createdAt: new Date().toISOString()
            }
        ];
        
        localStorage.setItem('recipes', JSON.stringify(sampleRecipes));
    }
    
    if (!localStorage.getItem('users')) {
        const sampleUsers = [
            {
                username: 'admin',
                email: 'admin@saboresmexico.com',
                password: 'admin123'
            }
        ];
        
        localStorage.setItem('users', JSON.stringify(sampleUsers));
    }
}

// Llamar a la inicialización de datos de ejemplo
initializeSampleData();