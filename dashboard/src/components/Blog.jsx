import ReactMarkdown from 'react-markdown'
import blogContent from '../blog.md?raw'

export default function Blog() {
  return (
    <div className="blog-prose">
      <ReactMarkdown>{blogContent}</ReactMarkdown>
    </div>
  )
}
