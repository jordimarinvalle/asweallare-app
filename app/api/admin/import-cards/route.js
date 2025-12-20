import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/supabase-server'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'

// Mapping of folder names to box IDs
const FOLDER_TO_BOX = {
  'white-box-demo': 'box_demo',
  'white-box-108': 'box_white',
  'white-box-216': 'box_white_xl',
  'black-box-108': 'box_black',
  'red-box-108': 'box_red'
}

export async function POST(request) {
  const supabase = createSupabaseServer()
  
  try {
    const body = await request.json()
    const { dryRun = true } = body // Default to dry run for safety
    
    const cardsDir = path.join(process.cwd(), 'public', 'cards')
    const results = {
      scanned: [],
      created: [],
      errors: [],
      dryRun
    }
    
    // Scan each box folder
    const boxFolders = fs.readdirSync(cardsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name !== 'backs')
      .map(dirent => dirent.name)
    
    for (const boxFolder of boxFolders) {
      const boxId = FOLDER_TO_BOX[boxFolder]
      if (!boxId) {
        results.errors.push(`Unknown box folder: ${boxFolder}`)
        continue
      }
      
      const boxPath = path.join(cardsDir, boxFolder)
      const subfolders = fs.readdirSync(boxPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
      
      for (const subfolder of subfolders) {
        const subfolderPath = path.join(boxPath, subfolder.name)
        
        // Determine card color from subfolder name
        let cardColor = null
        if (subfolder.name.includes('blacks')) {
          cardColor = 'black'
        } else if (subfolder.name.includes('whites')) {
          cardColor = 'white'
        }
        
        if (!cardColor) {
          results.errors.push(`Unknown card color for subfolder: ${subfolder.name}`)
          continue
        }
        
        // Scan PNG files in the subfolder
        const files = fs.readdirSync(subfolderPath)
          .filter(file => file.toLowerCase().endsWith('.png'))
        
        for (const file of files) {
          const imagePath = `${boxFolder}/${subfolder.name}/${file}`
          const cardTitle = file.replace('.png', '').replace(/-/g, ' ').replace(/_/g, ' ')
          
          const cardData = {
            id: uuidv4(),
            color: cardColor,
            title: cardTitle,
            hint: '',
            language: 'en',
            isdemo: boxId === 'box_demo',
            isactive: true,
            box_id: boxId,
            image_path: imagePath,
            createdat: new Date().toISOString()
          }
          
          results.scanned.push({
            file,
            imagePath,
            boxId,
            color: cardColor,
            title: cardTitle
          })
          
          if (!dryRun) {
            // Check if card with this image_path already exists
            const { data: existing } = await supabase
              .from('cards')
              .select('id')
              .eq('image_path', imagePath)
              .single()
            
            if (existing) {
              results.errors.push(`Card already exists: ${imagePath}`)
              continue
            }
            
            const { error } = await supabase
              .from('cards')
              .insert([cardData])
            
            if (error) {
              results.errors.push(`Error creating card ${imagePath}: ${error.message}`)
            } else {
              results.created.push(cardData)
            }
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: dryRun 
        ? `Dry run complete. Found ${results.scanned.length} cards. Set dryRun: false to actually import.`
        : `Import complete. Created ${results.created.length} cards.`,
      results
    })
    
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  // List current folder structure
  const cardsDir = path.join(process.cwd(), 'public', 'cards')
  const structure = {}
  
  try {
    const boxFolders = fs.readdirSync(cardsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name !== 'backs')
    
    for (const boxFolder of boxFolders) {
      const boxPath = path.join(cardsDir, boxFolder.name)
      structure[boxFolder.name] = {}
      
      const subfolders = fs.readdirSync(boxPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
      
      for (const subfolder of subfolders) {
        const subfolderPath = path.join(boxPath, subfolder.name)
        const files = fs.readdirSync(subfolderPath)
          .filter(file => file.toLowerCase().endsWith('.png'))
        
        structure[boxFolder.name][subfolder.name] = files.length
      }
    }
    
    return NextResponse.json({
      success: true,
      structure,
      folderMapping: FOLDER_TO_BOX
    })
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
