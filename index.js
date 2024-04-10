const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
// const corsFunctions = require('@google-cloud/functions-framework');

/**
 * HTTP function that supports CORS requests.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
// corsFunctions.http('corsEnabledFunction', (req, res) => {
  
//   res.set('Access-Control-Allow-Origin', '*');

//   if (req.method === 'OPTIONS') {
//     res.set('Access-Control-Allow-Methods', 'GET');
//     res.set('Access-Control-Allow-Headers', 'Content-Type');
//     res.set('Access-Control-Max-Age', '3600');
//     res.status(204).send('');
//   } else {
//     res.send('Hello World!');
//   }
// });


const isValidName = (name) => {
    const namePattern = /^[a-zA-Z\s]+$/;
    return namePattern.test(name);
}

const isValidURL = (url) => {
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return urlPattern.test(url);
};

exports.photoGallery = functions.https.onRequest(async (req, res) => {
    try {
        const method = req.method;
        const path = req.path;

        res.set('Access-Control-Allow-Origin', '*');

        if (method === 'GET' && path === '/getAllPhotos') {
            const allImages = await db.collection('photoGallery').get();
            const retrievedImages = [];
            allImages.forEach((doc) => {
                const images = {
                    id: doc.id,
                    name: doc.data().name,
                    imageURL: doc.data().imageURL,
                    description: doc.data().description,
                    isLiked: doc.data().isLiked,
                    createdDate: doc.data().createdDate,
                };
                retrievedImages.push(images);
            });
            return res.status(200).json(retrievedImages);
        }

        else if(method === 'POST' && path === '/addPhoto') {
                const { name, imageURL, description } = req.body;
        
                if (!name || name.trim().length === 0 ) {
                    return res.status(400).json({ error: "Name is required" });
                }
        
                if(!isValidName(name)){
                return res.status(400).json({ error: "Name must contain only alphabetic characters" });
                }
        
                if (!imageURL) {
                    return res.status(400).json({ error: "Image URL is required." });
                }
                
                if (!isValidURL(imageURL)) {
                    return res.status(400).json({ error: "Invalid imageURL format." });
                }
        
                if (!description) {
                    return res.status(400).json({ error: "Description is required." });
                }
        
                    const image = {
                    name,
                    imageURL,
                    description,
                    isLiked:false,
                    createdDate: Date()
                };
        
                const docRef = await db.collection('photoGallery').add(image);
                const addedImage = {
                    id: docRef.id,
                    ...image
                };
        
                res.status(201).json(addedImage);
            
        }
        else if (method === 'PUT' && path === '/isLiked') {
            const id = req.body.id;
            const isLiked = req.body.isLiked;
        
            if (isLiked === "" || id === "") {
                return res.status(201).json({ error: "Invalid content found" });
            }
        
            if (typeof isLiked !== 'boolean') {
                return res.status(400).json({ error: "isLiked must be a boolean value" });
            }
        
            const isLikedData = db.collection('photoGallery').doc(id);
        
            try {
                const doc = await isLikedData.get();
        
                if (!doc.exists) {
                    return res.status(404).json({ error: "Id not found" });
                }
        
                await isLikedData.update({ isLiked });
                res.status(200).json({ id, message: "isLiked field updated successfully" });
            } catch (error) {
                console.error("Error updating isLiked field:", error);
                return res.status(500).json({ error: "Endpoint not found" });
            }
        }
        
        else if(method === 'DELETE' && path === '/deletePhoto') {
        
                const id = req.body.id;
                const deleteDoc = db.collection('photoGallery').doc(id);
                try {
                    const doc = await deleteDoc.get();
                    
                    if (!doc.exists) {
                    return res.status(404).json({ error: "Id not found" });
                }
                await deleteDoc.delete();
                res.status(200).json({ id, message: "Deleted successfully" });

            }catch (error) {
                console.error("Error occur in delete :", error);
                return res.status(500).json({ error: "Error" });
            }
        }
        else{
            return res.status(400).json({err : "Endpoint does not found"})
        }
    }
    catch (err) {
        return res.status(500).json({ error: err});
    }
});
