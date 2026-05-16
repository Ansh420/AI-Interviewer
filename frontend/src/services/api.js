const API_BASE_URL = "http://localhost:8000/api/v1";

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${API_BASE_URL}/upload_resume`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error("Failed to upload resume");
  }
  
  return await response.json();
};

export const getWebSocketUrl = () => {
  return "ws://localhost:8000/api/v1/ws/interview";
};
