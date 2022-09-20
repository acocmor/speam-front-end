const token = "715a8dae-0e69-4aad-b7d4-d767c2890204"

$(document).ready(function() {
    $('#call-api').click(function(e) {
        $('#loading-call-api').removeClass('loading-invisible')
        $('#conent-data-devices').html('')
        $.ajax({
            url: 'https://api.kft-edv.de/graebert/request',
            dataType: "json",
            headers: {"Content-Type": "application/json", "Authorization": `Basic ${token}`},
            type: "Post",
            async: true,
            data: { },
            success: function (data) {
                $('#loading-call-api').addClass('loading-invisible')
               console.log('OKOKOKOKOKOK')
            },
            error: function (xhr, exception) {
                $('#loading-call-api').addClass('loading-invisible')
                var msg = "";
                if (xhr.status === 0) {
                    msg = "Not connect.\n Verify Network." + xhr.responseText;
                } else if (xhr.status == 404) {
                    msg = "Requested page not found. [404]" + xhr.responseText;
                } else if (xhr.status == 500) {
                    msg = "Internal Server Error [500]." +  xhr.responseText;
                } else if (exception === "parsererror") {
                    msg = "Requested JSON parse failed.";
                } else if (exception === "timeout") {
                    msg = "Time out error." + xhr.responseText;
                } else if (exception === "abort") {
                    msg = "Ajax request aborted.";
                } else {
                    msg = "Error:" + xhr.status + " " + xhr.responseText;
                }
                $('#conent-data-devices').html(`<p>${msg}</p>`)
                console.log('Error: ', exception)
            }
        }); 
    })
})