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
        achievementButton : document.getElementById('achievementButton')
    };
    const modals = {
        moodButton : document.getElementById('moodModal'),
        budgetButton : document.getElementById('budgetModal'),
        inviteButton : document.getElementById('inviteModal'),
        achievementButton : document.getElementById('achievementModal')
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

        //displayed the user's itineraries
        itineraryTitleElement.textContent = details.title || 'Untitled Itinerary';
        itineraryDescriptionElement.textContent = details.description || 'No details available.';

    } catch (error) {
        console.error('Error displaying details:', error);
    }

    
}

