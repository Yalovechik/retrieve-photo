import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagesUrl, setImagesUrl] = useState([]);
  const [image, setImage] = useState([]);
  const [uploadOccurred, setUploadOccurred] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      alert("Please select a PDF file.");
    }
  };

  const uploadEndpoint =
    "https://gucnmk1j8a.execute-api.us-east-1.amazonaws.com/dev/upload";
  const extractEndpoint =
    "https://gucnmk1j8a.execute-api.us-east-1.amazonaws.com/dev/extract";
  const endPointGet =
    "https://gucnmk1j8a.execute-api.us-east-1.amazonaws.com/dev/projects ";

  const handleUpload = () => {
    if (selectedFile) {
      setUploading(true);

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
          setSelectedFile(null);
          const { url, fields } = response.data.url;
          const formData = new FormData();

          for (const field in fields) {
            formData.append(field, fields[field]);
          }

          formData.append("file", selectedFile);

          axios
            .post(url, formData)
            .then(() => {
              const { project_id } = response.data;
              const extractBody = {
                document_name: fields.key,
                project_id: project_id,
              };

              axios
                .post(extractEndpoint, JSON.stringify(extractBody), {
                  headers: {
                    "Content-Type": "application/json",
                  },
                })
                .then(() => {
                  setUploadOccurred(true);
                  setUploading(false);
                })
                .catch((error) => {
                  console.log("Error during extraction:", error);
                  setUploading(false);
                });
            })
            .catch((error) => {
              console.log("Error uploading to S3:", error);
              setUploading(false);
            });
        })
        .catch((error) => {
          console.error("Error uploading file:", error);
          setUploading(false);
        });
    }
  };

  useEffect(() => {
    axios.get(endPointGet).then((response) => {
      try {
        const imageData = JSON.parse(response.data.body);
        setImagesUrl(imageData);
        setUploadOccurred(false);
      } catch (error) {
        console.error("Error parsing image data:", error);
      }
    });
  }, [uploadOccurred]);

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
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      <div>
        <h2>Uploaded Images:</h2>
        <ul>
          {imagesUrl.map((imageId, index) => (
            <li style={{ listStyle: "none" }} key={index}>
              <a href="#" onClick={() => getData(imageId)}>
                {imageId}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="image-container">
        {image.map((img, index) => (
          <img key={index} src={img} alt={`Image ${index}`} />
        ))}
      </div>
    </>
  );
}

export default App;
