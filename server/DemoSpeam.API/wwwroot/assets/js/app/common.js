
let DBURL = 'http://localhost:5000'
let Items = [];
let LotsGeometry = {};
let lineCount = 1;
let selectAll = false;


document.addEventListener("addNewRoom", function(event) { // (1)
    
    var result = JSON.parse(event.detail) 
    // console.log('str result: -------- ', event.detail)
    // console.log('result: -------- ', result)
    if (result) {

        result.MarkupID = parseInt(result.MarkupID);
        var newRoom = {}
        newRoom.MarkupID = result.MarkupID;
        newRoom.DisplayName = 'Room ' + result.MarkupID;
        newRoom.json = {0: result};
        newRoom.completed = true;

        // console.log('ok', newRoom)

        Items.push(newRoom)

        const idRoom = `check-box-room-${newRoom?.MarkupID}`
        const html = `<div class="card">
                            <div class="card-body">
                                <input type="checkbox" class="form-check-input" onclick="selectCard(${newRoom?.MarkupID})" checked id="${idRoom}"/> 
                                Room: ${newRoom?.MarkupID}
                                </div>
                            </div>`;
        $('#room-all').append(html);
    }


});
