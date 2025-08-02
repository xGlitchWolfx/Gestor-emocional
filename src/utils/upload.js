import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from '../config/cloudinary.js'

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'informes-tareas',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif']
  }
})

const upload = multer({ storage }).single('imagen')

export default upload