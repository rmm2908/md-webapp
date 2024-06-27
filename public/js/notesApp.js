// User only has database rw access to namespace with their ID

var formActive = false;

function getLatestId(){
    const uid = firebase.auth().currentUser.uid;
    const dbRef = firebase.database().ref("users/"+uid+"/incID");
    return dbRef.get().then((snapshot)=>{
        if (snapshot.exists()){
            console.log("id exists")
            return snapshot.val();
        }
        else {
            console.log("id does not exist")
            dbRef.set(0);
            return 0;
        }
    }).catch((error)=>{
        console.log(error);
    })
}

function incId(){
    getLatestId().then((oldID)=>{
        const uid = firebase.auth().currentUser.uid;
        const dbRef = firebase.database().ref("users/"+uid+"/incID");
        dbRef.set(oldID+1);
    })
}

function createCollapseButton(cardId, nodeTitle, expanded){
    const collapseButton = document.createElement("button");
    collapseButton.addEventListener('mousedown', cancelForm);
    collapseButton.setAttribute("class", "btn btn-link collapsed")
    collapseButton.setAttribute("data-bs-toggle", "collapse");
    collapseButton.setAttribute("data-bs-target", "#note"+cardId);
    collapseButton.setAttribute("aria-expanded", "false");
    collapseButton.setAttribute("aria-controls", "note"+cardId);
    collapseButton.setAttribute("aria-expanded", expanded);
    collapseButton.innerText = nodeTitle;

    return collapseButton;
}

function createEditButton(cardId){
    const editButton = document.createElement("button");
    editButton.setAttribute("class", "btn btn-primary");
    editButton.setAttribute("type", "button");
    editButton.setAttribute("style", "float: right; margin: 10px");
    editButton.setAttribute("onclick", `editNote(${cardId})`)
    editButton.innerText = "Edit";

    return editButton;
}

function createDeleteButton(cardId){
    const deleteButton = document.createElement("button");
    deleteButton.setAttribute("class", "btn btn-danger");
    deleteButton.setAttribute("type", "button");
    deleteButton.setAttribute("style", "float: right; margin: 10px");
    deleteButton.setAttribute("onclick", `deleteNote(${cardId})`);
    deleteButton.innerText = "Delete";

    return deleteButton;
}

function createHeading(cardId, nodeTitle, timestamp, expanded){


    let date = new Date(timestamp).toLocaleString();

    const headingContainer = document.createElement("div");
    const header = document.createElement("h5");
    const edited = document.createElement("p");
    const collapseButton = createCollapseButton(cardId, nodeTitle, expanded);
    const editButton = createEditButton(cardId);
    const deleteButton = createDeleteButton(cardId);

    edited.innerText = `Last edited: ${date}`;
    header.setAttribute("class", "mb-0");

    headingContainer.setAttribute("class", "card-header");
    headingContainer.setAttribute("id", "heading"+cardId);



    header.append(collapseButton, editButton, deleteButton, edited);
    headingContainer.appendChild(header);

    return headingContainer;
}

function createMdBody(content, format){
    const cardBody = document.createElement("div");
    cardBody.setAttribute("class", "card-body");
    if(format){
        let formatted = JSON.parse('"'+content+'"');
        cardBody.innerHTML = marked.parse(formatted);
    }
    else{
        cardBody.innerHTML = marked.parse(content)
    }


    return cardBody;
}

function createCard(mdName, mdData, cardBody, expanded){
    const noteID = mdName.replace("note", "");
    const note = document.createElement("div");
    const header = createHeading(noteID, mdData.title, mdData.edited, expanded);
    const noteContainer = document.createElement("div");
    let collapse = "collapse"

    if (expanded === "true"){
        collapse = "collapse show"
    }

    note.setAttribute("class", "card");
    note.setAttribute("id", "card"+noteID)

    noteContainer.setAttribute("id", mdName);
    noteContainer.setAttribute("class", collapse);
    noteContainer.setAttribute("aria-labelledby", "heading"+noteID);
    noteContainer.setAttribute("data-bs-parent", "#accordion");

    noteContainer.appendChild(cardBody);
    note.append(header, noteContainer);

    return note;
}
function signOut(){
    firebase.auth().signOut().then(()=>{
        formActive = false;
        const noData = document.getElementById("no_data");
        noData.setAttribute("hidden", "")
        console.log("Signed out successfully");
    }).catch((error)=>{
        console.log(error);
    });
}

function updateDb(noteName, title, content, timestamp){
    const uid = firebase.auth().currentUser.uid;
    const dbRef = firebase.database().ref("users/"+uid+"/notes/"+noteName);

    content = content.replace(/\n/g, "\\n");
    dbRef.child("title").set(title);
    dbRef.child("content").set(content);
    dbRef.child("edited").set(timestamp);
}

function noteSubmit(event){
    formActive = false;
    event.preventDefault();
    let noteName = event.currentTarget.parentNode.parentNode.id;
    let headerId = event.currentTarget.parentNode.parentNode.parentNode.firstElementChild.id;
    const header = document.getElementById(headerId);
    let title = event.target.title.value;
    let content = event.target.md.value;
    let timestamp = Date.now();
    let newDate = new Date(timestamp).toLocaleString();
    header.firstElementChild.lastElementChild.innerText = `Last edited: ${newDate}`;

    event.currentTarget.parentNode.parentNode.parentNode.firstElementChild.firstElementChild.firstElementChild.innerText = title;
    let tmpNode = document.createElement("div");
    tmpNode.appendChild(createMdBody(content, false));
    event.currentTarget.parentNode.parentNode.innerHTML = tmpNode.innerHTML;

    document.getElementById("no_data").setAttribute("hidden", "");

    updateDb(noteName, title, content, timestamp)

    console.log(`${noteName} updated!`)
}

function createFormCard(title, content){
    const form = document.createElement("form");
    const labelTitle = document.createElement("label");
    const labelText = document.createElement("label");
    const textInput = document.createElement("input");
    const submit = document.createElement("input");
    const textArea = document.createElement("textarea");
    const cancelButton = createCancelButton();

    textArea.setAttribute("name", "md");
    textArea.setAttribute("form", "mdForm");
    textArea.setAttribute("style", "resize: vertical; width: 75%; height: 35vh");
    textArea.setAttribute("required", "")
    content = content.replace(/\n/g, '&#10;');
    textArea.innerHTML = content;

    labelText.setAttribute("style", "width: 100%");
    labelText.appendChild(textArea);

    labelText.append(cancelButton);

    submit.setAttribute("type", "submit");
    submit.setAttribute("value", "Save");
    submit.setAttribute("class", "btn btn-info");
    submit.setAttribute("style", "margin: 10px");
    textInput.setAttribute("type", "text");
    textInput.setAttribute("name", "title");
    textInput.setAttribute("required", "")
    textInput.setAttribute("value", title)

    labelTitle.innerText = "Enter a title: ";
    labelTitle.append(textInput, submit);

    form.setAttribute("id", "mdForm");
    form.setAttribute("onsubmit", "noteSubmit(event)");

    form.append(labelTitle, labelText)

    return form;
}

function editNote(noteId){
    if (!formActive){
        formActive = true;
        const uid = firebase.auth().currentUser.uid;
        const dbRef = firebase.database().ref("users/"+uid+"/notes/note"+noteId);

        dbRef.get().then((snapshot)=>{
            if (snapshot.exists()){
                let content = snapshot.val().content;
                content = JSON.parse('"'+content+'"');
                let title = snapshot.val().title;
                const form = createFormCard(title, content);
                const card = document.getElementById("note"+noteId).firstElementChild;
                const collapseButton = document.getElementById("heading"+noteId).firstElementChild.firstElementChild
                collapseButton.setAttribute("aria-expanded", "true");
                document.getElementById("note"+noteId).setAttribute("class", "collapse show")
                card.setAttribute("class", "card-body text-center");

                let tmpNode = document.createElement("div");
                tmpNode.appendChild(form);

                card.innerHTML = tmpNode.innerHTML;
            }
        }).catch((error)=>{
            console.log(error)
        });

    }
    else{
        alert("Another form is already active")
    }
}


function createNewNote(){
    if (!formActive) {
        formActive = true;
        getLatestId().then((newId)=>{
            console.log("new Id in create")
            console.log(newId)
            let data = {
                content: "Write something...",
                title: "New Note",
                edited: Date.now()
            }
            const cardBody = document.createElement("div");
            cardBody.setAttribute("class", "card-body text-center");
            const form = createFormCard("New Note", "Write something...");
            cardBody.appendChild(form);

            const card = createCard("note"+newId, data, cardBody, "true");
            const accordion = document.getElementById("accordion");
            accordion.appendChild(card);
            incId();
        })

    }
    else {
        alert("Another form is already active");
    }
}

function deleteDataSet(dataId){
    const uid = firebase.auth().currentUser.uid;
    const dbRef = firebase.database().ref("users/"+uid+"/notes/note"+dataId);
    dbRef.remove();
}

function deleteNote(cardId){
    if (formActive){
        alert("Another form is already active");
        return;
    }
    if (confirm("Are you sure you want to delete Note "+cardId+"?")) {
        const card = document.getElementById("card" + cardId);
        card.remove();
        deleteDataSet(cardId);
        console.log(`Note ${cardId} deleted!`)
    }
    else {
        console.log("Deletion cancelled!")
    }
}

function renderNotes() {
    const dbRef = firebase.database().ref();
    const uid = firebase.auth().currentUser.uid;
    dbRef.child("users/"+uid+"/notes").get().then((snapshot)=>{
        if (snapshot.exists()){
            const accordion = document.getElementById("accordion");
            for (const [noteKey, data] of Object.entries(snapshot.val())){
                let cardBody = createMdBody(data.content, true);
                accordion.appendChild(createCard(noteKey, data, cardBody, "false"));
            }
        }
        else {
            const noData = document.getElementById("no_data");
            noData.removeAttribute("hidden")
            console.log("no data")
        }
    }).catch((error)=>{
        console.log(error);
    });
}

function createNewNoteButton() {
    const newNote = document.getElementById("new_note");
    const newButton = document.createElement("button");
    newButton.setAttribute("type", "button");
    newButton.setAttribute("class", "btn btn-success");
    newButton.setAttribute("onclick", "createNewNote()");
    newButton.setAttribute("style", "margin: 10px");
    newButton.innerText = "New";
    newNote.appendChild(newButton);
}

function cancelForm(event) {
    if (formActive){
        if (confirm("Are you sure you want to cancel?")){
            formActive = false;
            let accordion = document.getElementById("accordion");
            accordion.innerHTML = "";
            renderNotes();
        }
        else {
            console.log("Cancelling aborted")
            event.preventDefault();
            event.stopPropagation();
        }
    }
}

function createCancelButton(){
    const cancelButton = document.createElement("button");
    cancelButton.setAttribute("type", "button");
    cancelButton.setAttribute("class", "btn btn-secondary");
    cancelButton.setAttribute("style", "margin: 10px");
    cancelButton.setAttribute("onclick", "cancelForm(event)");
    cancelButton.innerText = "Cancel";
    return cancelButton;
}