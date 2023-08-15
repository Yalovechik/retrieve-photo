import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagesUrl, setImagesUrl] = useState([]);
  const [image, setImage] = useState([]);
  const [uploadOccurred, setUploadOccurred] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const uploadEndpoint =
    "https://gucnmk1j8a.execute-api.us-east-1.amazonaws.com/dev/upload";
  const extractEndpoint =
    "https://gucnmk1j8a.execute-api.us-east-1.amazonaws.com/dev/extract";
  const endPointGet =
    "https://gucnmk1j8a.execute-api.us-east-1.amazonaws.com/dev/projects ";

  console.log(selectedFile?.name, "selectedFile");

  const handleUpload = () => {
    if (selectedFile) {
      const payload = {
        document_name: selectedFile.name,
      };

      const dataStringify = JSON.stringify(payload);
      axios
        .post(uploadEndpoint, dataStringify, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          console.log("File uploaded successfully:", response);
          if (response) {
            const { url, fields } = response.data.url; // Extract url and fields
            const formData = new FormData(); // Create FormData object

            for (const field in fields) {
              formData.append(field, fields[field]);
            }

            // Append the actual file to the FormData
            formData.append("file", selectedFile);

            axios
              .post(url, formData) // Use pre-signed URL to upload the file
              .then((uploadResponse) => {
                console.log("File uploaded to S3:", uploadResponse);

                const { project_id } = response.data; // Extract project_id
                const extractBody = {
                  document_name: fields.key, // Use url.fields.key
                  project_id: project_id,
                };

                axios
                  .post(extractEndpoint, JSON.stringify(extractBody), {
                    headers: {
                      "Content-Type": "application/json",
                    },
                  })
                  .then((response) => {
                    console.log(response, "RESPONSE");
                    setUploadOccurred(true); // Set uploadOccurred to true after extraction
                  });
              })
              .catch((error) => console.log("Error uploading to S3:", error));
          }
        })
        .catch((error) => {
          console.error("Error uploading file:", error);
        });
    }
  };

  useEffect(() => {
    axios.get(endPointGet).then((response) => {
      const imageData = JSON.parse(response.data.body); // Parse the JSON string
      setImagesUrl(imageData); // Set the parsed array as imagesUrl
      setUploadOccurred(false);
    });
  }, [uploadOccurred]);

  console.log(imagesUrl, typeof imagesUrl, "TYPEOFDATA");

  const getData = (id) => {
    axios
      .get(
        `https://gucnmk1j8a.execute-api.us-east-1.amazonaws.com/dev/images?project_id=${id}`
      )
      .then((response) => {
        setImage(response.data);
      })
      .catch((error) => console.log(error));
  };

  return (
    <>
      <div>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>
      </div>

      <div>
        <h2>Uploaded Images:</h2>
        <ul>
          {imagesUrl.map((imageId, index) => (
            <li key={index}>
              <a href="#" onClick={() => getData(imageId)}>
                {`image ${index}`}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div>
        {image.map((img, index) => (
          <img key={index} src={img} alt={`Image ${index}`} />
        ))}
      </div>
    </>
  );
}

export default App;
