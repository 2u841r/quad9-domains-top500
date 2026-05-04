import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import blogContent from '../blog.md?raw'

export default function Blog() {
  return (
    <div className="blog-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{blogContent}</ReactMarkdown>
    </div>
  )
}
