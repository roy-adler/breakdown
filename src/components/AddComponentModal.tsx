import { useStore } from '../store/useStore'
import { Modal } from './Modal'
import { ComponentForm } from './ComponentForm'

interface Props {
  parentId: string | null
  onClose: () => void
}

export function AddComponentModal({ parentId, onClose }: Props) {
  const addComponent = useStore(s => s.addComponent)

  return (
    <Modal title={parentId ? 'Add Child Component' : 'Add Root Component'} onClose={onClose}>
      <ComponentForm
        submitLabel="Add Component"
        onSubmit={data => {
          addComponent({ ...data, parentId })
          onClose()
        }}
      />
    </Modal>
  )
}
