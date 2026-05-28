import type { MusicItem } from '../../types/music'

export interface FolderNode {
  id: number
  name: string
  parentId: number | null
  children: FolderNode[]
}

interface FolderTreeProps {
  folders: FolderNode[]
  musics: MusicItem[]
  onCreateFolder: (parentId: number | null) => void
  onEditFolder: (folder: FolderNode) => void
  onDeleteFolder: (folderId: number) => void
  onMoveMusic: (musicId: number, folderId: number | null) => void
  onPlay: (music: MusicItem) => void
  onEditMusic: (music: MusicItem) => void
  onDeleteMusic: (id: number) => void
}

interface FolderBranchProps {
  folder: FolderNode
  musics: MusicItem[]
  onCreateFolder: (parentId: number | null) => void
  onEditFolder: (folder: FolderNode) => void
  onDeleteFolder: (folderId: number) => void
  onMoveMusic: (musicId: number, folderId: number | null) => void
  onPlay: (music: MusicItem) => void
  onEditMusic: (music: MusicItem) => void
  onDeleteMusic: (id: number) => void
}

function FolderBranch({
  folder,
  musics,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onMoveMusic,
  onPlay,
  onEditMusic,
  onDeleteMusic,
}: FolderBranchProps) {
  const folderMusics = musics.filter((music) => music.folderId === folder.id)

  return (
    <div
      className="folder-node"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        const musicId = Number(event.dataTransfer.getData('text/plain'))
        if (Number.isFinite(musicId)) {
          onMoveMusic(musicId, folder.id)
        }
      }}
    >
      <div className="folder-node-header">
        <div>
          <p className="folder-node-title">{folder.name}</p>
          <p className="folder-node-subtitle">{folderMusics.length} músicas</p>
        </div>

        <div className="folder-node-actions">
          <button type="button" className="btn-secondary" onClick={() => onCreateFolder(folder.id)}>+ subpasta</button>
          <button type="button" className="btn-secondary" onClick={() => onEditFolder(folder)}>Editar</button>
          <button type="button" className="btn-danger" onClick={() => onDeleteFolder(folder.id)}>Excluir</button>
        </div>
      </div>

      <div className="folder-content">
        {folderMusics.map((music) => (
          <article
            key={music.id}
            className="folder-music-item"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', String(music.id))
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              onMoveMusic(music.id, folder.id)
            }}
          >
            <div>
              <p className="folder-music-title">{music.title}</p>
              <p className="folder-music-artist">{music.artist}</p>
            </div>

            <div className="folder-music-actions">
              <button type="button" className="btn-secondary" onClick={() => onEditMusic(music)}>Editar</button>
              <button type="button" className="btn-primary" onClick={() => onPlay(music)}>Play</button>
              <button type="button" className="btn-danger" onClick={() => onDeleteMusic(music.id)}>Excluir</button>
            </div>
          </article>
        ))}

        {folder.children.map((child) => (
          <FolderBranch
            key={child.id}
            folder={child}
            musics={musics}
            onCreateFolder={onCreateFolder}
            onEditFolder={onEditFolder}
            onDeleteFolder={onDeleteFolder}
            onMoveMusic={onMoveMusic}
            onPlay={onPlay}
            onEditMusic={onEditMusic}
            onDeleteMusic={onDeleteMusic}
          />
        ))}
      </div>
    </div>
  )
}

export default function FolderTree(props: FolderTreeProps) {
  return (
    <div className="folder-tree-wrap">
      {props.folders.map((folder) => (
        <FolderBranch key={folder.id} {...props} folder={folder} />
      ))}
    </div>
  )
}
