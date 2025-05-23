document.addEventListener('DOMContentLoaded', () => {
    
    //////////////////////////////////////////
    //ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////
    const dashboardButton = document.getElementById('dashboardButton');

    // activities table is cleared when 'clear activities' button is clicked
    const clearActivitiesButton = document.getElementById('clearActivitiesButton');
if (clearActivitiesButton) {
    clearActivitiesButton.addEventListener('click', async () => {
        const itineraryId = new URLSearchParams(window.location.search).get('id');
        if (!itineraryId) {
            console.error('Itinerary ID is missing.');
            return;
        }

        if (!confirm("Are you sure you want to delete all activities?")) {
            return;
        }

        const result = await DataModel.deleteActivities(itineraryId);
        if (result) {
            displayItineraryDetails(); // Refresh the table after deletion
        } else {
            alert("Failed to clear activities.");
        }
    });

}
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

    //Submit Rating button function
    document.getElementById('submitRatingButton').addEventListener('click', async () => {
        const status = document.getElementById('ratingStatusMessage');
    
        if (!selectedRating || !currentActivityId) {
            status.textContent = 'Please select a rating.';
            status.style.color = 'red';
            return;
        }
    
        try {
            const response = await fetch(`/api/activities/${currentActivityId}/rate`, {
                method: 'POST',
                headers: {
                    'Authorization': localStorage.getItem('jwtToken'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ rating: selectedRating }),
            });
    
            const result = await response.json();
    
            if (!response.ok) {
                status.textContent = result.message || 'Rating failed.';
                status.style.color = 'red';
            } else {
                status.textContent = 'Rating submitted!';
                status.style.color = 'green';
    
                // Refresh the activities table with updated average ratings
                displayItineraryDetails();
            }
        } catch (err) {
            console.error(err);
            status.textContent = 'Error submitting rating.';
            status.style.color = 'red';
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
        // achievementButton : document.getElementById('achievementButton'),
        editButton : document.getElementById('editButton'),
        generateRandomButton : document.getElementById('generateRandomButton'),
        filterActivitiesButton : document.getElementById('filterActivitiesButton'),
        clearActivitiesButton : document.getElementById('clearActivitiesButton')
    };

    const modals = {
        inviteButton : document.getElementById('inviteModal'),
        // achievementButton : document.getElementById('achievementModal'),
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
async function setFilters() {
    const mood = document.getElementById('filterMood').value;
    const min = document.getElementById('minBudget').value;
    const max = document.getElementById('maxBudget').value;

    const cityCheckboxes = document.querySelectorAll('#cityCheckboxes input[type="checkbox"]:checked');
    const selectedCities = Array.from(cityCheckboxes).map(cb => cb.value);

    const filters = {
        cities: selectedCities.length > 0 ? selectedCities : null,
        mood: mood || null,
        minCost: min ? parseFloat(min) : null,
        maxCost: max ? parseFloat(max) : null
    };

    window.filters = filters;

    document.getElementById('filterModal').style.display = 'none';
}


async function generateRandom(){
    
    const limitValue = document.getElementById('randomCount').value;
    const limit = limitValue ? parseInt(limitValue) : 1;  // Default to 3 if no valid limit is selected
    const { cities, mood, minCost, maxCost } = window.filters || {};
    const urlParams = new URLSearchParams(window.location.search);
    const itineraryId = urlParams.get('id');
    DataModel.postItineraryActivities(limit, itineraryId, cities, mood, minCost, maxCost);
    displayItineraryDetails();
}

//This allows the title and description of the itinerary page to reflect what's in the database
async function displayItineraryDetails() {
    const itineraryTitleElement = document.getElementById('itinerary-title');
    const itineraryTime = document.getElementById('itinerary-time');
    const itineraryDescriptionElement = document.getElementById('itinerary-description');
    const body = document.getElementById('page-body');
    const itineraryLocation = document.getElementById('itinerary-location');
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
        itineraryLocation.textContent = details.location || 'No Location available';
        
        //Allows Css to be changed by location
        if (details.location.includes('France')) {
            body.classList.add('theme-france');
        } else if (details.location.includes('Arizona')) {
            body.classList.add('theme-arizona');
        } else {
            body.classList.add('theme-default');
        }
        // formating the time
        const date = new Date(details.start_date);
        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        itineraryTime.textContent = formattedTime || 'To Be Determined';

        const inviteIdElement = document.getElementById('inviteId');
        inviteIdElement.textContent = `Your Invite ID: ${itineraryId}`;
        // Load city checkboxes based on location
const cityCheckboxesContainer = document.getElementById('cityCheckboxes');
cityCheckboxesContainer.innerHTML = '<p>Loading cities...</p>';

try {
    const cityResponse = await fetch(`/api/itineraries/${itineraryId}/cities`, {
        headers: {
            'Authorization': localStorage.getItem('jwtToken')
        }
    });

    const cityData = await cityResponse.json();

    if (cityResponse.ok && cityData.cities.length > 0) {
        cityCheckboxesContainer.innerHTML = '';
        cityData.cities.forEach(city => {
            const checkbox = document.createElement('label');
            checkbox.innerHTML = `
                <input type="checkbox" value="${city}"> ${city}
            `;
            cityCheckboxesContainer.appendChild(checkbox);
        });
    } else {
        cityCheckboxesContainer.innerHTML = '<p>No cities available for this itinerary.</p>';
    }
} catch (err) {
    console.error('Error loading cities:', err);
    cityCheckboxesContainer.innerHTML = '<p>Error loading cities.</p>';
}


        // Fetch activities and populate the table
        const activities = await DataModel.getItineraryActivities(itineraryId);
        activitiesTableBody.innerHTML = '';

        const startDate = new Date(details.start_date);
        const endDate = new Date(details.end_date);
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        let currentIndex = 0;
        let assignedActivities = [];

        // updated logic for date and time of each activity
        for (let i = 0; i < totalDays; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const numActivities = i % 2 === 0 ? 3 : 2;

            for (let j = 0; j < numActivities && currentIndex < activities.length; j++) {
                const activity = activities[currentIndex];
                const activityTime = new Date(currentDate);
                const startHour = startDate.getHours();
                const startMinute = startDate.getMinutes();
                activityTime.setHours(startHour + j * 3, startMinute); 

                assignedActivities.push({
                    ...activity,
                    displayDate: currentDate.toLocaleDateString(),
                    displayTime: activityTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });

                currentIndex++;
            }
        }
        
        // updated table
        if (assignedActivities.length === 0) {
            activitiesTableBody.innerHTML = '<tr><td colspan="6">No activities found.</td></tr>';
        } else {
            assignedActivities.forEach(activity => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="open-modal">${activity.ActivityName}</td>
                    <td>${activity.ActivityCity}, ${activity.ActivityLocation}</td>
                    <td>${activity.ActivityMood}</td>
                    <td>${activity.ActivityCost}</td>
                    <td>${activity.averageRating || 'Not rated'}</td>
                    <td>${activity.displayDate} - ${activity.displayTime}</td>
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
let currentActivityId = null;
let selectedRating = 0;

async function openActivityModal(activity) {
    const activityModal = document.getElementById('activityModal');
    currentActivityId = activity.ActivityId;
    document.getElementById('modalActivityName').textContent = activity.ActivityName;

    selectedRating = 0;

    try {
        const response = await fetch(`/api/activities/${currentActivityId}/rating`, {
            method: 'GET',
            headers: {
                'Authorization': localStorage.getItem('jwtToken')
            }
        });

        const result = await response.json();

        if (response.ok && result.userRating) {
            selectedRating = result.userRating;
        }
    } catch (err) {
        console.error('Error fetching existing rating:', err);
    }

    generateStars(); // create stars
    highlightStars(selectedRating); // highlight based on userRating
    activityModal.style.display = 'block';
}

//Generate stars
function generateStars() {
    const container = document.getElementById('rating-stars');
    container.innerHTML = '';
    selectedRating = 0;

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.classList.add('star');
        star.dataset.index = i;

        const leftZone = document.createElement('div');
        leftZone.classList.add('star-zone', 'left');
        leftZone.addEventListener('mouseenter', () => highlightStars(i - 0.5));
        leftZone.addEventListener('click', () => {
            selectedRating = i - 0.5;
            highlightStars(selectedRating);
        });

        const rightZone = document.createElement('div');
        rightZone.classList.add('star-zone', 'right');
        rightZone.addEventListener('mouseenter', () => highlightStars(i));
        rightZone.addEventListener('click', () => {
            selectedRating = i;
            highlightStars(selectedRating);
        });

        const starWrapper = document.createElement('div');
        starWrapper.classList.add('star-wrapper');
        star.textContent = '★';

        starWrapper.appendChild(star);
        starWrapper.appendChild(leftZone);
        starWrapper.appendChild(rightZone);
        container.appendChild(starWrapper);
    }

    container.addEventListener('mouseleave', () => highlightStars(selectedRating));
}



//Highlight stars when selected
function highlightStars(value) {
    const stars = document.querySelectorAll('.star');

    stars.forEach((star, index) => {
        const starIndex = index + 1;

        star.style.color = 'lightgray';
        star.style.background = '';
        star.style.webkitBackgroundClip = '';
        star.style.webkitTextFillColor = '';

        if (value >= starIndex) {
            star.style.color = 'gold';
        } else if (value >= starIndex - 0.5) {
            star.style.background = 'linear-gradient(to right, gold 50%, lightgray 50%)';
            star.style.webkitBackgroundClip = 'text';
            star.style.webkitTextFillColor = 'transparent';
        }
    });
}


// This allows the modal to be closed when clicking the "x"
document.getElementById('closeActivityModal').addEventListener('click', () => {
    document.getElementById('activityModal').style.display = 'none';
    document.getElementById('ratingStatusMessage').textContent = '';
});

// This closes the modal when clicking outside the modal
window.addEventListener('click', (event) => {
    const activityModal = document.getElementById('activityModal');
    if (event.target === activityModal) {
        activityModal.style.display = 'none';
        document.getElementById('ratingStatusMessage').textContent = '';
    }
});

