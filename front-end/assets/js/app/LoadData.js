function loadData(fileName) {
    selectAll = false;
    fetch(`${URL_BASE}/data/${fileName}.json`).then(r => r.json()).then( data=> {
        Items = data;
        Items.forEach(i => i.json=JSON.parse(i.json));

        $('#room-all').append(`<p>File name: <span class="file-name">${fileName}</span></p>`);

        const allHtmlCheckBox = `<div class="card">
                            <div class="card-body">
                                <input type="checkbox" class="form-check-input" onclick="selectCard('all')" /> 
                                All
                                </div>
                            </div>`;
        $('#room-all').append(allHtmlCheckBox);
        
        Items.map((v, i) => {
            console.log(v)
            const idRoom = `check-box-room-${v?.MarkupID}`
            const html = `<div class="card">
                                <div class="card-body">
                                <input type="checkbox" class="form-check-input" onclick="selectCard(${v?.MarkupID})" id="${idRoom}" /> 
                                Room: ${v?.MarkupID}
                                </div>
                            </div>`;
            $('#room-all').append(html);
        });
    });

    console.log('Load data oke')
}
