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

    //All these buttons handle creating a new Itinerary
    const addItineraryButton = document.getElementById("addItineraryButton");
    const createItineraryContainer = document.getElementById("createItineraryContainer");
    const itineraryForm = document.getElementById('itineraryForm');
    const cancelFormButton = document.getElementById('cancelButton');
    const statusMessage = document.getElementById('statusMessage');
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
        // The renderUserList will be removed later on
        // renderUserList();
        displayAllItineraries();
    });

    // User is sent to interary creation page on click
    addItineraryButton.addEventListener("click", function() {
        createItineraryContainer.style.display = "block";
    });

    cancelFormButton.addEventListener("click", function(){
        createItineraryContainer.style.display = "none";
    })

    itineraryForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const title = document.getElementById('title').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const description = document.getElementById('description').value;

        try{
            const newItinerary = await DataModel.createItinerary(title, description, startDate, endDate);

            if (newItinerary) {
                statusMessage.textContent = "Itinerary created successfully!";
                statusMessage.style.color = "green";
    
                // Clear form fields
                itineraryForm.reset();
    
                // Hide form after successful submission
                setTimeout(() => {
                    createItineraryContainer.style.display = "none";
                    statusMessage.textContent = "";
                }, 1500);
    
                // Refresh itinerary list
                displayAllItineraries();
            } else {
                statusMessage.textContent = "Error creating itinerary.";
                statusMessage.style.color = "red";
            }
        } catch (error) {
            console.error("Error:", error);
            statusMessage.textContent = "Something went wrong.";
            statusMessage.style.color = "red";
        }
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
        // The renderUserList will be removed later on
        // renderUserList();
        displayAllItineraries();
    }
    //////////////////////////////////////////
    //END CODE THAT NEEDS TO RUN IMMEDIATELY AFTER PAGE LOADS
    //////////////////////////////////////////
});
//END OF DOMCONTENTLOADED


//////////////////////////////////////////
//FUNCTIONS TO MANIPULATE THE DOM
//////////////////////////////////////////
//This function allows for all itineraries to be displayed for a certain user
async function displayAllItineraries() {
    const itineraryListElement = document.getElementById('itineraryList');
    const itineraryCountElement = document.getElementById('itineraryCount');

    itineraryListElement.innerHTML = '<div class="loading-message">Loading itineraries...</div>';

    try {
        //connects to DataModal.js
        const itineraries = await DataModel.getItineraries();

        itineraryListElement.innerHTML = ''; // Clear previous content of loading message

        //displayed the user's itineraries
        if (itineraries.length === 0) {
            itineraryListElement.innerHTML = '<p>No itineraries found.</p>';
        } else {
            itineraries.forEach(itinerary => {
                const listItem = document.createElement('div');
                listItem.classList.add('itinerary-item');
                const itineraryLink = document.createElement('a');
                //the code below allows for the specific itinerary information to be displayed
                itineraryLink.href = `/dashboard/itinerary?id=${itinerary.id}`;
                itineraryLink.textContent = itinerary.title || 'Unnamed Itinerary';
                itineraryLink.classList.add('itinerary-link');

                listItem.appendChild(itineraryLink);
                itineraryListElement.appendChild(listItem);
            });
        }

        //this changes the "Total Itineraries" on the dashboard.html to a count that's accurate
        itineraryCountElement.textContent = `Total Itineraries: ${itineraries.length}`;
    } catch (error) {
        console.error('Error displaying itineraries:', error);
        itineraryListElement.innerHTML = '<p>Failed to load itineraries.</p>';
    }
}

//It's current function allows the user's emails to link to iteneraries
//--This will later be changed to the specific user's page an all their itineraries being displayed--
//--When a user selects a specific itenerary, it will pull up the plans/schedule--
// async function renderUserList() {
//     const userListElement = document.getElementById('userList');
//     userListElement.innerHTML = '<div class="loading-message">Loading user list...</div>';
//     const users = await DataModel.getUsers(); 
//     users.forEach(user => {
//         const userItem = document.createElement('div');
//         userItem.classList.add('user-item');
//         const itineraryLink = document.createElement('a');
//         itineraryLink.href = `/dashboard/itinerary`;
//         itineraryLink.textContent = user;
//         itineraryLink.classList.add('itinerary-link');

//         userItem.appendChild(itineraryLink)
//         userListElement.appendChild(userItem);
//     });
// }
//////////////////////////////////////////
//END FUNCTIONS TO MANIPULATE THE DOM
//////////////////////////////////////////