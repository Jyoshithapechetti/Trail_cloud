/*global HitchHop _config*/

var HitchHop = window.HitchHop || {};
HitchHop.map = HitchHop.map || {};

(function rideScopeWrapper($) {
    var authToken;
    HitchHop.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });
    function requestCab(pickupLocation) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/ride',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                PickupLocation: {
                    Latitude: pickupLocation.latitude,
                    Longitude: pickupLocation.longitude
                }
            }),
            contentType: 'application/json',
            success: completeRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when requesting your Cab:\n' + jqXHR.responseText);
            }
        });
    }

    function completeRequest(result) {
        var Cab;
        var pronoun;
        console.log('Response received from API: ', result);
        Cab = result.Cab;
        pronoun = Cab.Gender === 'Male' ? 'his' : 'her';
        displayUpdate(Cab.Name + ', your ' + Cab.Color + ' Cab, is on ' + pronoun + ' way.');
        animateArrival(function animateCallback() {
            displayUpdate(Cab.Name + ' has arrived. Giddy up!');
            HitchHops.map.unsetLocation();
            $('#request').prop('disabled', 'disabled');
            $('#request').text('Set Pickup');
        });
    }

    // Register click handler for #request button
    $(function onDocReady() {
        $('#request').click(handleRequestClick);
        $(HitchHop.map).on('pickupChange', handlePickupChanged);

        HitchHop.authToken.then(function updateAuthMessage(token) {
            if (token) {
                displayUpdate('You are authenticated. Click to see your <a href="#authTokenModal" data-toggle="modal">auth token</a>.');
                $('.authToken').text(token);
            }
        });

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }
    });

    function handlePickupChanged() {
        var requestButton = $('#request');
        requestButton.text('Request Cab');
        requestButton.prop('disabled', false);
    }

    function handleRequestClick(event) {
        var pickupLocation = HitchHop.map.selectedPoint;
        event.preventDefault();
        requestCab(pickupLocation);
    }

    function animateArrival(callback) {
        var dest = HitchHop.map.selectedPoint;
        var origin = {};

        if (dest.latitude > HitchHop.map.center.latitude) {
            origin.latitude = HitchHop.map.extent.minLat;
        } else {
            origin.latitude = HitchHop.map.extent.maxLat;
        }

        if (dest.longitude > HitchHop.map.center.longitude) {
            origin.longitude = HitchHop.map.extent.minLng;
        } else {
            origin.longitude = HitchHop.map.extent.maxLng;
        }

        HitchHop.map.animate(origin, dest, callback);
    }

    function displayUpdate(text) {
        $('#updates').append($('<li>' + text + '</li>'));
    }
}(jQuery));
