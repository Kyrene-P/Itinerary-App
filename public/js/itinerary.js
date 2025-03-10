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
        moodButton : document.getElementById('moodButton'),
        budgetButton : document.getElementById('budgetButton'),
        inviteButton : document.getElementById('inviteButton'),
        achievementButton : document.getElementById('achievementButton'),
        editButton : document.getElementById('editButton')
    };
    const modals = {
        moodButton : document.getElementById('moodModal'),
        budgetButton : document.getElementById('budgetModal'),
        inviteButton : document.getElementById('inviteModal'),
        achievementButton : document.getElementById('achievementModal'),
        editButton : document.getElementById('editModal')
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

//This allows the title and description of the itinerary page to reflect what's in the database
async function displayItineraryDetails() {
    const itineraryTitleElement = document.getElementById('itinerary-title');
    const itineraryDescriptionElement = document.getElementById('itinerary-description');

    const editTitle = document.getElementById('editTitle');
    const editDescription = document.getElementById('editDescription');

    //Getting the itinerary's id from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const itineraryId = urlParams.get('id');

    if (!itineraryId) {
        console.error('Itinerary ID is missing in the URL.');
        return;
    }

    try {
        //connects to DataModal.js
        const details = await DataModel.getDetails(itineraryId);

        if (!details) {
            itineraryTitleElement.textContent = 'Itinerary not found';
            itineraryDescriptionElement.textContent = '';
            return;
        }

        editTitle.value = details.title;
        editDescription.value = details.description;

        //displayed the user's itineraries
        itineraryTitleElement.textContent = details.title || 'Untitled Itinerary';
        itineraryDescriptionElement.textContent = details.description || 'No details available.';
        
        
        const inviteIdElement = document.getElementById('inviteId');
        inviteIdElement.textContent = `Your Invite ID: ${itineraryId}`;

    } catch (error) {
        console.error('Error displaying details:', error);
    }
}

