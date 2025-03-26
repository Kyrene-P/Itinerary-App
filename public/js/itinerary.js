document.addEventListener('DOMContentLoaded', () => {
    
    //////////////////////////////////////////
    //ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////
    const dashboardButton = document.getElementById('dashboardButton');
    //////////////////////////////////////////
    //END ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////


    //////////////////////////////////////////
    //EVENT LISTENERS
    //////////////////////////////////////////
    // Return user to dashboard
    dashboardButton.addEventListener('click', () => {
        window.location.href = '/dashboard';
    });

    //This is the form to edit the Itinerary
    document.getElementById('editItineraryForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const itineraryId = new URLSearchParams(window.location.search).get('id');
    const title = document.getElementById('editTitle').value;
    const description = document.getElementById('editDescription').value;

    try {
        const result = await DataModel.updateItinerary(itineraryId, title, description);

        if (result) {
            // This addition updates the itinerary when edited
            document.getElementById('itinerary-title').textContent = title;
            document.getElementById('itinerary-description').textContent = description;

            // Show success message
            document.getElementById('statusMessage').textContent = "Itinerary updated successfully!";
            document.getElementById('statusMessage').style.color = "green";

            // After submitting the edit, it hides the form
            setTimeout(() => {
                document.getElementById('editItineraryContainer').style.display = 'none';
                document.getElementById('editButton').style.display = 'block';
                document.getElementById('statusMessage').textContent = "";
            }, 1000);
        } else {
            document.getElementById('statusMessage').textContent = "Error updating itinerary.";
            document.getElementById('statusMessage').style.color = "red";
        }
    } catch (error) {
        console.error("Error:", error);
        document.getElementById('statusMessage').textContent = "Something went wrong.";
        document.getElementById('statusMessage').style.color = "red";
    }
});

    document.getElementById('deleteButton').addEventListener('click', async function() {
        const itineraryId = new URLSearchParams(window.location.search).get('id');
    
        if (!confirm("Are you sure you want to delete this itinerary?")) {
            return;
        }
    
        try {
            const remove = await DataModel.deleteItinerary(itineraryId);
    
            if (remove) {
                alert("Itinerary deleted successfully!");
                window.location.href = "/dashboard"; // Redirect to dashboard
            } else {
                alert("Error deleting itinerary.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong.");
        }
    });

    //////////////////////////////////////////
    //END EVENT LISTENERS
    //////////////////////////////////////////

    //////////////////////////////////////////
    //MODALS
    //////////////////////////////////////////
     const buttons = {
        inviteButton : document.getElementById('inviteButton'),
        achievementButton : document.getElementById('achievementButton'),
        editButton : document.getElementById('editButton'),
        generateRandomButton : document.getElementById('generateRandomButton'),
        filterActivitiesButton : document.getElementById('filterActivitiesButton')
    };

    const modals = {
        inviteButton : document.getElementById('inviteModal'),
        achievementButton : document.getElementById('achievementModal'),
        editButton : document.getElementById('editModal'),
        generateRandomButton : document.getElementById('randomModal'),
        filterActivitiesButton : document.getElementById('filterModal')
    };

    //The user can press the button for a specific feature and the modal will open
    Object.keys(buttons).forEach(key => {
        buttons[key].addEventListener('click', () => {
            modals[key].style.display = 'block';
        });
    });

    //When user clicks on the (x), it will close
    document.querySelectorAll('.close').forEach(closeButton =>{
        closeButton.addEventListener('click', (event) => {
            const modalId = event.target.getAttribute('data-modal');
            document.getElementById(modalId).style.display = 'none';
        });
    });

    //When user clicks outside the modal, it will close
    window.addEventListener('click', (event) => {
        Object.values(modals).forEach(modal => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    //////////////////////////////////////////
    //END MODALS
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
        displayItineraryDetails();
    }
    //////////////////////////////////////////
    //END CODE THAT NEEDS TO RUN IMMEDIATELY AFTER PAGE LOADS
    //////////////////////////////////////////
});
//END OF DOMCONTENTLOADED

//Sets the filters when the apply button is pressed
async function setFilters(){
    const mood = document.getElementById('filterMood').value;
    const min = document.getElementById('minBudget').value;
    const max= document.getElementById('maxBudget').value;
    const location = document.getElementById('filterLocation').value;
    const filters = {
        location: location ? location : null,
        mood: mood ? mood : null,  // If mood is not selected, store as null
        minCost: min ? parseFloat(min) : null,  // If min is empty, store as null
        maxCost: max ? parseFloat(max) : null  // If max is empty, store as null
    };

    
    window.filters = filters;

    // modal closes after applying filters
    document.getElementById('filterModal').style.display = 'none';
}

async function generateRandom(){
    
    const limitValue = document.getElementById('randomCount').value;
    const limit = limitValue ? parseInt(limitValue) : 1;  // Default to 3 if no valid limit is selected
    const { location, mood, minCost, maxCost } = window.filters || {};
    const urlParams = new URLSearchParams(window.location.search);
    const itineraryId = urlParams.get('id');
    DataModel.postItineraryActivities(limit, itineraryId, location, mood, minCost, maxCost);
    displayItineraryDetails();
}

//This allows the title and description of the itinerary page to reflect what's in the database
async function displayItineraryDetails() {
    const itineraryTitleElement = document.getElementById('itinerary-title');
    const itineraryDescriptionElement = document.getElementById('itinerary-description');
    const activitiesTableBody = document.getElementById('activitiesTableBody');

    const urlParams = new URLSearchParams(window.location.search);
    const itineraryId = urlParams.get('id');

    if (!itineraryId) {
        console.error('Itinerary ID is missing in the URL.');
        return;
    }

    try {
        const details = await DataModel.getDetails(itineraryId);
        if (!details) {
            itineraryTitleElement.textContent = 'Itinerary not found';
            itineraryDescriptionElement.textContent = '';
            return;
        }

        itineraryTitleElement.textContent = details.title || 'Untitled Itinerary';
        itineraryDescriptionElement.textContent = details.description || 'No details available.';
        const inviteIdElement = document.getElementById('inviteId');
        inviteIdElement.textContent = `Your Invite ID: ${itineraryId}`;

        // Fetch activities and populate the table
        const activities = await DataModel.getItineraryActivities(itineraryId);
        activitiesTableBody.innerHTML = '';

        if (activities.length === 0) {
            activitiesTableBody.innerHTML = '<tr><td colspan="4">No activities found.</td></tr>';
        } else {
            activities.forEach(activity => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="open-modal">${activity.ActivityName}</td>
                    <td>${activity.ActivityLocation}</td>
                    <td>${activity.ActivityMood}</td>
                    <td>${activity.ActivityCost}</td>
                `;
                activitiesTableBody.appendChild(row);

                row.querySelector('.open-modal').addEventListener('click', () => {
                    openActivityModal(activity);
                });
            });
        }
    } catch (error) {
        console.error('Error displaying itinerary details:', error);
    }
}

// This handles the activity modal
function openActivityModal(activity) {
    const activityModal = document.getElementById('activityModal');

    document.getElementById('modalActivityName').textContent = activity.ActivityName;
    
    // Show modal
    activityModal.style.display = 'block';
}

// This allows the modal to be closed when clicking the "x"
document.getElementById('closeActivityModal').addEventListener('click', () => {
    document.getElementById('activityModal').style.display = 'none';
});

// This closes the modal when clicking outside the modal
window.addEventListener('click', (event) => {
    const activityModal = document.getElementById('activityModal');
    if (event.target === activityModal) {
        activityModal.style.display = 'none';
    }
});

