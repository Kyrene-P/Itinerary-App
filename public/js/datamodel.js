////////////////////////////////////////////////////////////////
//DATAMODEL.JS
//THIS IS YOUR "MODEL", IT INTERACTS WITH THE ROUTES ON YOUR
//SERVER TO FETCH AND SEND DATA.  IT DOES NOT INTERACT WITH
//THE VIEW (dashboard.html) OR THE CONTROLLER (dashboard.js)
//DIRECTLY.  IT IS A "MIDDLEMAN" BETWEEN THE SERVER AND THE
//CONTROLLER.  ALL IT DOES IS MANAGE DATA.
////////////////////////////////////////////////////////////////

const DataModel = (function () {
    //WE CAN STORE DATA HERE SO THAT WE DON'T HAVE TO FETCH IT
    //EVERY TIME WE NEED IT.  THIS IS CALLED "CACHING".
    //WE CAN ALSO STORE THINGS HERE TO MANAGE STATE, LIKE
    //WHEN THE USER SELECTS SOMETHING IN THE VIEW AND WE
    //NEED TO KEEP TRACK OF IT SO WE CAN USE THAT INFOMRATION
    //LATER.  RIGHT NOW, WE'RE JUST STORING THE JWT TOKEN
    //AND THE LIST OF USERS.
    let token = null;  // Holds the JWT token
    let users = [];    // Holds the list of user emails

    //WE CAN CREATE FUNCTIONS HERE TO FETCH DATA FROM THE SERVER
    //AND RETURN IT TO THE CONTROLLER.  THE CONTROLLER CAN THEN
    //USE THAT DATA TO UPDATE THE VIEW.  THE CONTROLLER CAN ALSO
    //SEND DATA TO THE SERVER TO BE STORED IN THE DATABASE BY
    //CALLING FUNCTIONS THAT WE DEFINE HERE.
    return {
        //utility function to store the token so that we
        //can use it later to make authenticated requests
        setToken: function (newToken) {
            token = newToken;
        },

        //function to fetch the list of users from the server
        getUsers: async function () {
            // Check if the token is set
            if (!token) {
                console.error("Token is not set.");
                return [];
            }

            try {
                // this is our call to the /api/users route on the server
                const response = await fetch('/api/users', {
                    method: 'GET',
                    headers: {
                        // we need to send the token in the headers
                        'Authorization': token,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    console.error("Error fetching users:", await response.json());
                    return [];
                }

                const data = await response.json();
                //store the emails in the users variable so we can
                //use them again later without having to fetch them
                users = data.emails;
                //return the emails to the controller
                //so that it can update the view
                return users;
            } catch (error) {
                console.error("Error in API call:", error);
                return [];
            }
        },

        //ADD MORE FUNCTIONS HERE TO FETCH DATA FROM THE SERVER
        //AND SEND DATA TO THE SERVER AS NEEDED

        //This gets the itinerary information that is displayed on the dashboard
 
        getItineraries: async function () {
            if (!token) {
                console.error("Token is not set.");
                return [];
            }

            try {
                const response = await fetch('/api/itineraries', {
                    method: 'GET',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    console.error("Error fetching itineraries:", await response.json());
                    return [];
                }

                const data = await response.json();
                return data.itineraries;
            } catch (error) {
                console.error("Error in API call:", error);
                return [];
            }
        },

        //This gets the details from a specific itinerary to the itinerary page
        getDetails: async function (id) {
            if (!token) {
                console.error("Token is not set.");
                return null;
            }

            try {
                const response = await fetch(`/api/itineraries/${id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    console.error("Error fetching itinerary details:", await response.json());
                    return null;
                }

                return await response.json();
            } catch (error) {
                console.error("Error in API call:", error);
                return null;
            }
        },

        createItinerary: async function (title, description, startDate, endDate, time, location) {
            if (!token) {
                console.error("Token is not set.");
                return null;
            }
        
            try {
                const response = await fetch('/api/itineraries', {
                    method: 'POST',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: title,
                        description: description || '',
                        start_date: `${startDate}T${time}`,
                        end_date: endDate,
                        location: location
                    }),
                });
        
                if (!response.ok) {
                    console.error("Error creating itinerary:", await response.json());
                    return null;
                }
        
                return await response.json();
            } catch (error) {
                console.error("Error in API call:", error);
                return null;
            }
        },

        updateItinerary: async function (id, title, description) {
            if (!token) {
                console.error("Token is not set.");
                return null;
            }

            try {
                const response = await fetch(`/api/itineraries/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: title,
                        description: description || ''
                    }),
                });

                if (!response.ok) {
                    console.error("Error updating itinerary:", await response.json());
                    return null;
                }

                return await response.json();
            } catch (error) {
                console.error("Error in API call:", error);
                return null;
            }
        },

        deleteItinerary: async function (id) {
            if (!token) {
                console.error("Token is not set.");
                return null;
            }

            try {
                const response = await fetch(`/api/itineraries/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    console.error("Error deleting itinerary:", await response.json());
                    return null;
                }

                return await response.json();
            } catch (error) {
                console.error("Error in API call:", error);
                return null;
            }
        },
        joinItinerary: async function (inviteCode) {
            if (!token) {
                console.error("Token is not set.");
                return null;
            }

            try {
                const response = await fetch('/api/itineraries/join', {
                    method: 'POST',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ inviteCode }),
                });

                if (!response.ok) {
                    console.error("Error joining itinerary:", await response.json());
                    return null;
                }

                return await response.json();
            } catch (error) {
                console.error("Error in API call:", error);
                return null;
            }
            
        },
        getUserItineraries: async function () {
            if (!token) {
                console.error("Token is not set.");
                return [];
            }

            try {
                const response = await fetch('/api/user-itineraries', {
                    method: 'GET',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    console.error("Error fetching user itineraries:", await response.json());
                    return [];
                }

                const data = await response.json();
                return data.itineraries;
            } catch (error) {
                console.error("Error in API call:", error);
                return [];
            }
        },
        postItineraryActivities: async function (limit, itineraryId, cities, mood, minCost, maxCost) {
            if (!token) {
                console.error("Token is not set.");
                return [];
            }
        
            try {
                const response = await fetch(`/api/itineraries/${itineraryId}/activities`, {
                    method: 'POST',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        cities: cities,
                        mood: mood,
                        minCost: minCost,
                        maxCost: maxCost,
                        limit: limit  // You can also dynamically adjust the limit if needed
                    }),
                });
        
                if (!response.ok) {
                    console.error("Error fetching activities:", await response.json());
                    return [];
                }
        
                const data = await response.json();
                return data.activities;
            } catch (error) {
                console.error("Error in API call:", error);
                return [];
            }
        },

        deleteActivities: async function (id) {
            if (!token) {
                console.error("Token is not set.");
                return null;
            }

            try {
                const response = await fetch(`/api/UserActivities/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    console.error("Error deleting itinerary:", await response.json());
                    return null;
                }

                return await response.json();
            } catch (error) {
                console.error("Error in API call:", error);
                return null;
            }
        },

        getItineraryActivities: async function (itineraryId) {
            if (!token) {
                console.error("Token is not set.");
                return [];
            }
        
            try {
                const response = await fetch(`/api/itineraries/${itineraryId}/activities`, {
                    method: 'GET',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json',
                    },
                });
        
                if (!response.ok) {
                    console.error("Error fetching activities:", await response.json());
                    return [];
                }
        
                const data = await response.json();
                return data.activities;
            } catch (error) {
                console.error("Error in API call:", error);
                return [];
            }
        },

        getUserBadges: async function () {
            if (!token) {
                console.error("Token is not set.");
                return {
                    arizona: false,
                    france: false,
                    firstItinerary: false,
                    firstRating: false
                };
            }
        
            try {
                const response = await fetch('/api/badges', {
                    method: 'GET',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json',
                    },
                });
        
                if (!response.ok) {
                    console.error("Error fetching badges:", await response.json());
                    return {
                        arizona: false,
                        france: false,
                        firstItinerary: false,
                        firstRating: false
                    };
                }
        
                return await response.json();
            } catch (error) {
                console.error("Error fetching badge data:", error);
                return {
                    arizona: false,
                    france: false,
                    firstItinerary: false,
                    firstRating: false
                };
            }
        }

    };
})();