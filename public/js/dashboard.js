////////////////////////////////////////////////////////////////
//DASHBOARD.JS
//THIS IS YOUR "CONTROLLER", IT ACTS AS THE MIDDLEMAN
// BETWEEN THE MODEL (datamodel.js) AND THE VIEW (dashboard.html)
////////////////////////////////////////////////////////////////


//ADD ALL EVENT LISTENERS INSIDE DOMCONTENTLOADED
//AT THE BOTTOM OF DOMCONTENTLOADED, ADD ANY CODE THAT NEEDS TO RUN IMMEDIATELY
document.addEventListener('DOMContentLoaded', () => {
    
    //////////////////////////////////////////
    //ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////
    const logoutButton = document.getElementById('logoutButton');
    const refreshButton = document.getElementById('refreshButton');
    const addItineraryButton = document.getElementById("addItineraryButton");
    //////////////////////////////////////////
    //END ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////


    //////////////////////////////////////////
    //EVENT LISTENERS
    //////////////////////////////////////////
    // Log out and redirect to login
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    });

    // Refresh list when the button is clicked
    refreshButton.addEventListener('click', async () => {
        renderUserList();
    });

    // User is sent to interary creation page on click
    addItineraryButton.addEventListener("click", function() {
        window.location.href = "itinerary.html";
    });
    //////////////////////////////////////////
    //END EVENT LISTENERS
    //////////////////////////////////////////


    //////////////////////////////////////////////////////
    //CODE THAT NEEDS TO RUN IMMEDIATELY AFTER PAGE LOADS
    //////////////////////////////////////////////////////
    // Initial check for the token
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/';
    } else {
        DataModel.setToken(token);
        renderUserList();
    }
    //////////////////////////////////////////
    //END CODE THAT NEEDS TO RUN IMMEDIATELY AFTER PAGE LOADS
    //////////////////////////////////////////
});
//END OF DOMCONTENTLOADED


//////////////////////////////////////////
//FUNCTIONS TO MANIPULATE THE DOM
//////////////////////////////////////////

async function displayAllItineraries (){

}

//It's current function allows the user's emails to link to iteneraries
//--This will later be changed to the specific user's page an all their itineraries being displayed--
//--When a user selects a specific itenerary, it will pull up the plans/schedule--
async function renderUserList() {
    const userListElement = document.getElementById('userList');
    userListElement.innerHTML = '<div class="loading-message">Loading user list...</div>';
    const users = await DataModel.getUsers(); 
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.classList.add('user-item');
        const itineraryLink = document.createElement('a');
        itineraryLink.href = `/dashboard/itinerary`;
        itineraryLink.textContent = user;
        itineraryLink.classList.add('itinerary-link');

        userItem.appendChild(itineraryLink)
        userListElement.appendChild(userItem);
    });

    async function displayAllItineraries() {
        const itineraryListElement = document.getElementById('itineraryList');
        const itineraryCountElement = document.getElementById('itineraryCount');
    
        itineraryListElement.innerHTML = '<div class="loading-message">Loading itineraries...</div>';
    
        try {
            const itineraries = await DataModel.getItineraries();
    
            itineraryListElement.innerHTML = ''; // Clear previous content
    
            if (itineraries.length === 0) {
                itineraryListElement.innerHTML = '<p>No itineraries found.</p>';
            } else {
                itineraries.forEach(itinerary => {
                    const listItem = document.createElement('li');
                    const link = document.createElement('a');
    
                    link.href = `/dashboard/itinerary?id=${itinerary.id}`;
                    link.textContent = itinerary.destination || 'Unnamed Itinerary';
                    listItem.appendChild(link);
                    itineraryListElement.appendChild(listItem);
                });
            }
    
            itineraryCountElement.textContent = `Total Itineraries: ${itineraries.length}`;
        } catch (error) {
            console.error('Error displaying itineraries:', error);
            itineraryListElement.innerHTML = '<p>Failed to load itineraries.</p>';
        }
    }
    
    document.addEventListener('DOMContentLoaded', () => {
        displayAllItineraries(); // Load itineraries when the page loads
    
        document.getElementById('refreshButton').addEventListener('click', () => {
            displayAllItineraries(); // Refresh on button click
        });
    });
}
//////////////////////////////////////////
//END FUNCTIONS TO MANIPULATE THE DOM
//////////////////////////////////////////