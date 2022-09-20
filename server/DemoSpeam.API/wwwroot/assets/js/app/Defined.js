
// function selectCard(item) {
//     const id = item?.id;

//     viewer.dispatchEvent(new CustomEvent('newData', {'detail': item.json}));
// }
function selectCard(MarkupID) {
    if (viewer == null) {
        alert('Please selected file!');
        return;
    }
    
    if (MarkupID === 'all') {
        console.log('pokokokokokokoko')
        selectAll = !selectAll;
        Items.forEach(item => {
            if(item.completed && !selectAll) {
                item.completed = false
                viewer.dispatchEvent(new CustomEvent('removeData', {'detail': item.MarkupID}));
            } else if (!item.completed && selectAll) {
                item.completed = true
                viewer.dispatchEvent(new CustomEvent('newData', {'detail': [item.json, item.MarkupID]}));
            }
            if (selectAll) {
                $(`#check-box-room-${item.MarkupID}`).prop('checked', true);
            } else {
                $(`#check-box-room-${item.MarkupID}`).prop('checked', false);
            }
            
        })
    } else {
        var item = Items.find(o => o.MarkupID === MarkupID);

        if (item) {
            if(item.completed) {
                item.completed = false
                viewer.dispatchEvent(new CustomEvent('removeData', {'detail': item.MarkupID}));
            } else {
                item.completed = true
                viewer.dispatchEvent(new CustomEvent('newData', {'detail': [item.json, item.MarkupID]}));
            }
        }
    }
    

    console.log('choose --------------------: ', item)


}