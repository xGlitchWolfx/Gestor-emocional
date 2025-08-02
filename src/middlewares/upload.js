import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from '../config/cloudinary.js'

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tareas-completadas',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif']
  }
})

const upload = multer({ storage: storage })

export default upload